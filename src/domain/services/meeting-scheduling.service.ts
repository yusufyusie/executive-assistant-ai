/**
 * Meeting Scheduling Service - Domain Layer
 * Business logic for intelligent meeting scheduling
 */

import { Meeting, Attendee } from '../entities/meeting.entity';
import { DateRange } from '../common/value-objects';

export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // in minutes
}

export interface AvailabilityWindow {
  date: Date;
  availableSlots: TimeSlot[];
  conflictingMeetings: Meeting[];
}

export interface SchedulingSuggestion {
  timeSlot: TimeSlot;
  score: number;
  attendeeAvailability: Record<string, 'available' | 'busy' | 'unknown'>;
  conflicts: string[];
  reasons: string[];
}

export interface SchedulingRequest {
  title: string;
  duration: number; // in minutes
  attendees: Array<{ email: string; name: string; isRequired: boolean }>;
  preferredTimes?: TimeSlot[];
  earliestDate?: Date;
  latestDate?: Date;
  workingHours?: { start: string; end: string }; // e.g., "09:00", "17:00"
  excludeWeekends?: boolean;
  bufferTime?: number; // minutes between meetings
}

export interface SchedulingResult {
  suggestions: SchedulingSuggestion[];
  bestSuggestion?: SchedulingSuggestion;
  conflicts: Meeting[];
  summary: {
    totalSuggestions: number;
    optimalSlots: number;
    suboptimalSlots: number;
    conflictCount: number;
  };
}

export class MeetingSchedulingService {
  private readonly defaultWorkingHours = { start: '09:00', end: '17:00' };
  private readonly defaultBufferTime = 15; // minutes

  public findOptimalMeetingTimes(
    request: SchedulingRequest,
    existingMeetings: Meeting[]
  ): SchedulingResult {
    const workingHours = request.workingHours || this.defaultWorkingHours;
    const bufferTime = request.bufferTime || this.defaultBufferTime;
    const excludeWeekends = request.excludeWeekends !== false;
    
    const searchPeriod = this.getSearchPeriod(request);
    const availabilityWindows = this.generateAvailabilityWindows(
      searchPeriod,
      workingHours,
      excludeWeekends
    );
    
    const suggestions = this.generateSchedulingSuggestions(
      request,
      availabilityWindows,
      existingMeetings,
      bufferTime
    );
    
    const conflicts = this.findConflictingMeetings(suggestions, existingMeetings);
    const bestSuggestion = this.selectBestSuggestion(suggestions);
    const summary = this.generateSummary(suggestions, conflicts);
    
    return {
      suggestions,
      bestSuggestion,
      conflicts,
      summary,
    };
  }

  private getSearchPeriod(request: SchedulingRequest): { start: Date; end: Date } {
    const now = new Date();
    const start = request.earliestDate || new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const end = request.latestDate || new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
    
    return { start, end };
  }

  private generateAvailabilityWindows(
    searchPeriod: { start: Date; end: Date },
    workingHours: { start: string; end: string },
    excludeWeekends: boolean
  ): AvailabilityWindow[] {
    const windows: AvailabilityWindow[] = [];
    const current = new Date(searchPeriod.start);
    
    while (current <= searchPeriod.end) {
      if (excludeWeekends && (current.getDay() === 0 || current.getDay() === 6)) {
        current.setDate(current.getDate() + 1);
        continue;
      }
      
      const availableSlots = this.generateDailyTimeSlots(current, workingHours);
      
      windows.push({
        date: new Date(current),
        availableSlots,
        conflictingMeetings: [],
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return windows;
  }

  private generateDailyTimeSlots(
    date: Date,
    workingHours: { start: string; end: string }
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    
    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    // Generate 30-minute slots
    const current = new Date(startTime);
    while (current < endTime) {
      const slotEnd = new Date(current.getTime() + 30 * 60 * 1000);
      if (slotEnd <= endTime) {
        slots.push({
          start: new Date(current),
          end: new Date(slotEnd),
          duration: 30,
        });
      }
      current.setTime(current.getTime() + 30 * 60 * 1000);
    }
    
    return slots;
  }

  private generateSchedulingSuggestions(
    request: SchedulingRequest,
    availabilityWindows: AvailabilityWindow[],
    existingMeetings: Meeting[],
    bufferTime: number
  ): SchedulingSuggestion[] {
    const suggestions: SchedulingSuggestion[] = [];
    
    for (const window of availabilityWindows) {
      const windowSuggestions = this.findSuitableSlots(
        window,
        request,
        existingMeetings,
        bufferTime
      );
      suggestions.push(...windowSuggestions);
    }
    
    // Sort by score (highest first)
    suggestions.sort((a, b) => b.score - a.score);
    
    // Limit to top 10 suggestions
    return suggestions.slice(0, 10);
  }

  private findSuitableSlots(
    window: AvailabilityWindow,
    request: SchedulingRequest,
    existingMeetings: Meeting[],
    bufferTime: number
  ): SchedulingSuggestion[] {
    const suggestions: SchedulingSuggestion[] = [];
    const requiredDuration = request.duration;
    
    for (let i = 0; i <= window.availableSlots.length - Math.ceil(requiredDuration / 30); i++) {
      const startSlot = window.availableSlots[i];
      const endTime = new Date(startSlot.start.getTime() + requiredDuration * 60 * 1000);
      
      // Check if we have enough consecutive slots
      if (this.hasConsecutiveSlots(window.availableSlots, i, requiredDuration)) {
        const timeSlot: TimeSlot = {
          start: startSlot.start,
          end: endTime,
          duration: requiredDuration,
        };
        
        const suggestion = this.evaluateTimeSlot(
          timeSlot,
          request,
          existingMeetings,
          bufferTime
        );
        
        suggestions.push(suggestion);
      }
    }
    
    return suggestions;
  }

  private hasConsecutiveSlots(slots: TimeSlot[], startIndex: number, requiredDuration: number): boolean {
    const requiredSlots = Math.ceil(requiredDuration / 30);
    
    if (startIndex + requiredSlots > slots.length) {
      return false;
    }
    
    for (let i = 0; i < requiredSlots - 1; i++) {
      const currentSlot = slots[startIndex + i];
      const nextSlot = slots[startIndex + i + 1];
      
      if (currentSlot.end.getTime() !== nextSlot.start.getTime()) {
        return false;
      }
    }
    
    return true;
  }

  private evaluateTimeSlot(
    timeSlot: TimeSlot,
    request: SchedulingRequest,
    existingMeetings: Meeting[],
    bufferTime: number
  ): SchedulingSuggestion {
    let score = 100;
    const conflicts: string[] = [];
    const reasons: string[] = [];
    const attendeeAvailability: Record<string, 'available' | 'busy' | 'unknown'> = {};
    
    // Initialize attendee availability
    request.attendees.forEach(attendee => {
      attendeeAvailability[attendee.email] = 'unknown';
    });
    
    // Check for conflicts with existing meetings
    const conflictingMeetings = this.findConflictsForTimeSlot(timeSlot, existingMeetings, bufferTime);
    if (conflictingMeetings.length > 0) {
      score -= conflictingMeetings.length * 20;
      conflicts.push(`${conflictingMeetings.length} conflicting meeting(s)`);
    }
    
    // Prefer preferred times if specified
    if (request.preferredTimes && request.preferredTimes.length > 0) {
      const isPreferredTime = request.preferredTimes.some(preferred => 
        this.timeSlotsOverlap(timeSlot, preferred)
      );
      
      if (isPreferredTime) {
        score += 20;
        reasons.push('Matches preferred time');
      } else {
        score -= 10;
      }
    }
    
    // Prefer mid-morning and early afternoon slots
    const hour = timeSlot.start.getHours();
    if (hour >= 10 && hour <= 11) {
      score += 15;
      reasons.push('Optimal morning time');
    } else if (hour >= 14 && hour <= 15) {
      score += 10;
      reasons.push('Good afternoon time');
    } else if (hour < 9 || hour > 16) {
      score -= 15;
      reasons.push('Outside optimal hours');
    }
    
    // Prefer Tuesday to Thursday
    const dayOfWeek = timeSlot.start.getDay();
    if (dayOfWeek >= 2 && dayOfWeek <= 4) {
      score += 10;
      reasons.push('Optimal day of week');
    } else if (dayOfWeek === 1 || dayOfWeek === 5) {
      score -= 5;
      reasons.push('Suboptimal day of week');
    }
    
    // Penalize very long meetings
    if (request.duration > 120) {
      score -= 10;
      reasons.push('Long meeting duration');
    }
    
    // Bonus for shorter meetings
    if (request.duration <= 30) {
      score += 5;
      reasons.push('Short, focused meeting');
    }
    
    return {
      timeSlot,
      score: Math.max(score, 0),
      attendeeAvailability,
      conflicts,
      reasons,
    };
  }

  private findConflictsForTimeSlot(
    timeSlot: TimeSlot,
    existingMeetings: Meeting[],
    bufferTime: number
  ): Meeting[] {
    const conflicts: Meeting[] = [];
    
    for (const meeting of existingMeetings) {
      if (meeting.status === 'cancelled' || meeting.status === 'completed') {
        continue;
      }
      
      const meetingRange = meeting.dateRange;
      const proposedRange = new DateRange(
        new Date(timeSlot.start.getTime() - bufferTime * 60 * 1000),
        new Date(timeSlot.end.getTime() + bufferTime * 60 * 1000)
      );
      
      if (meetingRange.overlaps(proposedRange)) {
        conflicts.push(meeting);
      }
    }
    
    return conflicts;
  }

  private findConflictingMeetings(
    suggestions: SchedulingSuggestion[],
    existingMeetings: Meeting[]
  ): Meeting[] {
    const conflicts = new Set<Meeting>();
    
    for (const suggestion of suggestions) {
      const conflictingMeetings = this.findConflictsForTimeSlot(
        suggestion.timeSlot,
        existingMeetings,
        0
      );
      conflictingMeetings.forEach(meeting => conflicts.add(meeting));
    }
    
    return Array.from(conflicts);
  }

  private selectBestSuggestion(suggestions: SchedulingSuggestion[]): SchedulingSuggestion | undefined {
    if (suggestions.length === 0) {
      return undefined;
    }
    
    // Return the highest scored suggestion with no conflicts
    const conflictFreeSuggestions = suggestions.filter(s => s.conflicts.length === 0);
    if (conflictFreeSuggestions.length > 0) {
      return conflictFreeSuggestions[0];
    }
    
    // If all have conflicts, return the one with the highest score
    return suggestions[0];
  }

  private generateSummary(
    suggestions: SchedulingSuggestion[],
    conflicts: Meeting[]
  ): SchedulingResult['summary'] {
    const optimal = suggestions.filter(s => s.score >= 80 && s.conflicts.length === 0).length;
    const suboptimal = suggestions.length - optimal;
    
    return {
      totalSuggestions: suggestions.length,
      optimalSlots: optimal,
      suboptimalSlots: suboptimal,
      conflictCount: conflicts.length,
    };
  }

  private timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    return slot1.start < slot2.end && slot1.end > slot2.start;
  }

  public validateMeetingRequest(request: SchedulingRequest): string[] {
    const errors: string[] = [];
    
    if (!request.title.trim()) {
      errors.push('Meeting title is required');
    }
    
    if (request.duration <= 0) {
      errors.push('Meeting duration must be positive');
    }
    
    if (request.duration > 480) {
      errors.push('Meeting duration cannot exceed 8 hours');
    }
    
    if (request.attendees.length === 0) {
      errors.push('At least one attendee is required');
    }
    
    if (request.earliestDate && request.latestDate && request.earliestDate >= request.latestDate) {
      errors.push('Earliest date must be before latest date');
    }
    
    return errors;
  }
}

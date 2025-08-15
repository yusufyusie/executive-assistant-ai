/**
 * Task Prioritization Service - Domain Layer
 * Business logic for intelligent task prioritization
 */

import { Task } from '../entities/task.entity';
import { Priority } from '../common/value-objects';

export interface PrioritizationCriteria {
  dueDateWeight: number;
  priorityWeight: number;
  statusWeight: number;
  dependencyWeight: number;
  estimatedDurationWeight: number;
}

export interface PrioritizedTask {
  task: Task;
  score: number;
  recommendation: string;
  factors: {
    dueDate: number;
    priority: number;
    status: number;
    dependencies: number;
    estimatedDuration: number;
  };
}

export interface PrioritizationResult {
  prioritizedTasks: PrioritizedTask[];
  summary: {
    totalTasks: number;
    criticalTasks: number;
    highPriorityTasks: number;
    mediumPriorityTasks: number;
    lowPriorityTasks: number;
  };
  recommendations: string[];
}

export class TaskPrioritizationService {
  private readonly defaultCriteria: PrioritizationCriteria = {
    dueDateWeight: 0.3,
    priorityWeight: 0.25,
    statusWeight: 0.2,
    dependencyWeight: 0.15,
    estimatedDurationWeight: 0.1,
  };

  public prioritizeTasks(
    tasks: Task[],
    criteria: Partial<PrioritizationCriteria> = {}
  ): PrioritizationResult {
    const finalCriteria = { ...this.defaultCriteria, ...criteria };
    
    const prioritizedTasks = tasks.map(task => this.calculateTaskScore(task, finalCriteria));
    
    // Sort by score (highest first)
    prioritizedTasks.sort((a, b) => b.score - a.score);
    
    const summary = this.generateSummary(prioritizedTasks);
    const recommendations = this.generateRecommendations(prioritizedTasks);
    
    return {
      prioritizedTasks,
      summary,
      recommendations,
    };
  }

  private calculateTaskScore(task: Task, criteria: PrioritizationCriteria): PrioritizedTask {
    const factors = {
      dueDate: this.calculateDueDateScore(task),
      priority: this.calculatePriorityScore(task),
      status: this.calculateStatusScore(task),
      dependencies: this.calculateDependencyScore(task),
      estimatedDuration: this.calculateDurationScore(task),
    };

    const score = Math.round(
      factors.dueDate * criteria.dueDateWeight +
      factors.priority * criteria.priorityWeight +
      factors.status * criteria.statusWeight +
      factors.dependencies * criteria.dependencyWeight +
      factors.estimatedDuration * criteria.estimatedDurationWeight
    );

    const recommendation = this.generateTaskRecommendation(score, factors);

    return {
      task,
      score: Math.min(score, 100), // Cap at 100
      recommendation,
      factors,
    };
  }

  private calculateDueDateScore(task: Task): number {
    if (!task.dueDate) {
      return 20; // Base score for tasks without due date
    }

    const now = new Date();
    const dueDate = task.dueDate;
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) return 100; // Overdue
    if (daysDiff === 0) return 90; // Due today
    if (daysDiff === 1) return 80; // Due tomorrow
    if (daysDiff <= 3) return 70; // Due within 3 days
    if (daysDiff <= 7) return 50; // Due within a week
    if (daysDiff <= 14) return 30; // Due within 2 weeks
    if (daysDiff <= 30) return 20; // Due within a month
    
    return 10; // Due later
  }

  private calculatePriorityScore(task: Task): number {
    const priorityScores = {
      urgent: 100,
      high: 75,
      medium: 50,
      low: 25,
    };
    
    return priorityScores[task.priority.value];
  }

  private calculateStatusScore(task: Task): number {
    const statusScores = {
      'in-progress': 80,
      'pending': 60,
      'completed': 0,
      'cancelled': 0,
    };
    
    return statusScores[task.status.value];
  }

  private calculateDependencyScore(task: Task): number {
    // Tasks with no dependencies get higher score (can be started immediately)
    if (task.dependencies.length === 0) {
      return 80;
    }
    
    // More dependencies = lower score
    const dependencyPenalty = Math.min(task.dependencies.length * 10, 60);
    return Math.max(80 - dependencyPenalty, 20);
  }

  private calculateDurationScore(task: Task): number {
    if (!task.estimatedDuration) {
      return 50; // Neutral score for tasks without duration
    }

    // Shorter tasks get higher score (quick wins)
    if (task.estimatedDuration <= 30) return 80; // 30 minutes or less
    if (task.estimatedDuration <= 60) return 70; // 1 hour or less
    if (task.estimatedDuration <= 120) return 60; // 2 hours or less
    if (task.estimatedDuration <= 240) return 50; // 4 hours or less
    if (task.estimatedDuration <= 480) return 40; // 8 hours or less
    
    return 30; // Longer tasks
  }

  private generateTaskRecommendation(score: number, factors: any): string {
    if (score >= 90) {
      return 'Critical - Handle immediately';
    }
    
    if (score >= 80) {
      return 'High - Schedule for today';
    }
    
    if (score >= 60) {
      return 'Medium - Schedule for this week';
    }
    
    if (score >= 40) {
      return 'Low - Schedule when convenient';
    }
    
    return 'Defer - Consider delegating or postponing';
  }

  private generateSummary(prioritizedTasks: PrioritizedTask[]): PrioritizationResult['summary'] {
    const total = prioritizedTasks.length;
    const critical = prioritizedTasks.filter(t => t.score >= 90).length;
    const high = prioritizedTasks.filter(t => t.score >= 80 && t.score < 90).length;
    const medium = prioritizedTasks.filter(t => t.score >= 60 && t.score < 80).length;
    const low = prioritizedTasks.filter(t => t.score < 60).length;

    return {
      totalTasks: total,
      criticalTasks: critical,
      highPriorityTasks: high,
      mediumPriorityTasks: medium,
      lowPriorityTasks: low,
    };
  }

  private generateRecommendations(prioritizedTasks: PrioritizedTask[]): string[] {
    const recommendations: string[] = [];
    
    const criticalTasks = prioritizedTasks.filter(t => t.score >= 90);
    if (criticalTasks.length > 0) {
      recommendations.push(`Focus on ${criticalTasks.length} critical task(s) first`);
    }
    
    const overdueTasks = prioritizedTasks.filter(t => t.task.isOverdue);
    if (overdueTasks.length > 0) {
      recommendations.push(`${overdueTasks.length} task(s) are overdue and need immediate attention`);
    }
    
    const inProgressTasks = prioritizedTasks.filter(t => t.task.status.value === 'in-progress');
    if (inProgressTasks.length > 3) {
      recommendations.push('Consider focusing on completing in-progress tasks before starting new ones');
    }
    
    const highPriorityTasks = prioritizedTasks.filter(t => t.task.priority.value === 'urgent' || t.task.priority.value === 'high');
    if (highPriorityTasks.length > 5) {
      recommendations.push('High number of urgent/high priority tasks - consider delegating some tasks');
    }
    
    const tasksWithoutDueDate = prioritizedTasks.filter(t => !t.task.dueDate);
    if (tasksWithoutDueDate.length > 0) {
      recommendations.push(`${tasksWithoutDueDate.length} task(s) don't have due dates - consider setting deadlines`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Task priorities are well balanced. Continue with current schedule.');
    }
    
    return recommendations;
  }

  public suggestPriorityAdjustments(tasks: Task[]): Array<{
    task: Task;
    currentPriority: string;
    suggestedPriority: string;
    reason: string;
  }> {
    const suggestions: Array<{
      task: Task;
      currentPriority: string;
      suggestedPriority: string;
      reason: string;
    }> = [];

    for (const task of tasks) {
      const urgencyScore = task.urgencyScore;
      const currentPriority = task.priority.value;
      let suggestedPriority: string | null = null;
      let reason = '';

      // Suggest priority increase
      if (urgencyScore >= 80 && currentPriority !== 'urgent') {
        suggestedPriority = 'urgent';
        reason = task.isOverdue ? 'Task is overdue' : 'Task has high urgency score due to approaching deadline';
      } else if (urgencyScore >= 60 && currentPriority === 'low') {
        suggestedPriority = 'medium';
        reason = 'Task urgency has increased';
      } else if (urgencyScore >= 75 && currentPriority === 'medium') {
        suggestedPriority = 'high';
        reason = 'Task urgency has increased significantly';
      }

      // Suggest priority decrease
      if (urgencyScore < 30 && (currentPriority === 'urgent' || currentPriority === 'high')) {
        suggestedPriority = 'medium';
        reason = 'Task urgency has decreased';
      } else if (urgencyScore < 20 && currentPriority === 'medium') {
        suggestedPriority = 'low';
        reason = 'Task has low urgency and can be deprioritized';
      }

      if (suggestedPriority && suggestedPriority !== currentPriority) {
        suggestions.push({
          task,
          currentPriority,
          suggestedPriority,
          reason,
        });
      }
    }

    return suggestions;
  }
}

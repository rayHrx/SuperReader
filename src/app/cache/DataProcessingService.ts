// app/cache/DataProcessingService.ts

import {
  CourseOutline,
  StudyPlanResponse,
  StudyProgress,
  FieldModule,
  StudyPlan,
  UserExperience,
  DailyExperience,
  WeeklyExperience,
  Challenge,
  ChallengeSet,
  Challenges
} from "./Interfaces";

export class DataProcessingService {
  static calculateModuleProgress(
    fieldName: string,
    module: FieldModule,
    courseOutline: CourseOutline,
    progress: StudyProgress | undefined
  ): number {
    if (!progress) return 0;

    const field = progress.progress?.fields[fieldName];
    if (!field) return 0;

    const moduleProgress = field.modules[module.title];
    if (!moduleProgress) return 0;

    let totalSubtopics = 0;
    let completedSubtopics = 0;

    // Create a set of valid subtopics from the course outline
    const validSubtopics = new Set<string>();
    module.chapters.forEach((chapter) => {
      chapter.discussion_points.forEach((discussionPoint) => {
        discussionPoint.subtopic_titles.forEach((subtopic) => {
          validSubtopics.add(subtopic);
        });
        totalSubtopics += discussionPoint.subtopic_titles.length;
      });
    });

    Object.values(moduleProgress.chapters).forEach((chapter) => {
      Object.values(chapter.discussion_points).forEach((discussionPoint) => {
        Object.entries(discussionPoint.subtopics).forEach(([subtopicTitle, subtopic]) => {
          if (subtopic.status === "DONE" && validSubtopics.has(subtopicTitle)) {
            completedSubtopics++;
          }
        });
      });
    });

    return totalSubtopics > 0 ? (completedSubtopics / totalSubtopics) * 100 : 0;
  }

  static filterStudyPlansByCompletion(
    studyPlans: StudyPlan[],
    showCompleted: boolean,
    courseOutline: CourseOutline,
    moduleProgress: { [key: string]: number }
  ): StudyPlan[] {
    // Filter study plans based on whether they are completed or not for frontend toggle
    return studyPlans.filter((studyPlan) => {
      const averageProgress = this.calculateAverageProgress(
        this.getStudyPlanAllModulesInfo(studyPlan, courseOutline),
        moduleProgress
      );
      return showCompleted ? averageProgress === 100 : averageProgress < 100;
    });
  }

  static getSingleModuleInfo(courseOutline: CourseOutline, moduleName: string): { module: FieldModule; fieldName: string } | null {
    for (const field of courseOutline.course_outline.fields) {
      const module = field.modules.find((m) => m.title === moduleName);
      if (module) return { module, fieldName: field.title };
    }
    return null;
  }

  static calculateAverageProgress(
    moduleInfos: (ReturnType<typeof this.getSingleModuleInfo>)[],
    moduleProgress: { [key: string]: number }
  ): number {
    // Calculate the average progress of all modules in the study plan
    if (moduleInfos.length === 0) return 0;
    const totalProgress = moduleInfos.reduce((sum, moduleInfo) => {
      if (moduleInfo) {
        return sum + (moduleProgress[moduleInfo.module.title] || 0);
      }
      return sum;
    }, 0);
    return totalProgress / moduleInfos.length;
  }

  static getStudyPlanAllModulesInfo(studyPlan: StudyPlan, courseOutline: CourseOutline): (ReturnType<typeof this.getSingleModuleInfo>)[] {
    // Get all modules info in a single study plan
    const uniqueModules = new Set(
      studyPlan.study_plan_chapters.map((chapter) => chapter.module_name)
    );
    return Array.from(uniqueModules)
      .map((moduleName) => this.getSingleModuleInfo(courseOutline, moduleName))
      .filter(Boolean);
  }

  static calculateAllModuleProgress(
    courseOutline: CourseOutline,
    progressData: StudyProgress
  ): { [key: string]: number } {
    // For each module, calculate the progress
    return courseOutline.course_outline.fields.reduce(
      (acc, field) => {
        field.modules.forEach((module) => {
          acc[module.title] = this.calculateModuleProgress(
            field.title,
            module,
            courseOutline,
            progressData
          );

          // if (module.title == "Testing in Domain-Driven Design") {
          //   console.log(`----------------------- ${this.calculateModuleProgress(
          //     field.title,
          //     module,
          //     progressData
          //   )}`)
          // }
        });
        return acc;
      },
      {} as { [key: string]: number }
    );
  }


  // Library (single module)
  static getUniqueModules(studyPlans: StudyPlan[]): { single: string[], recommended: string[] } {
    const moduleSets = {
      single: new Set<string>(),
      recommended: new Set<string>(),
    };
    studyPlans.forEach((plan) => {
      const targetSet =
        plan.study_plan_type === "single_module"
          ? moduleSets.single
          : moduleSets.recommended;
      plan.study_plan_chapters.forEach((chapter) => {
        targetSet.add(chapter.module_name);
      });
    });
    return {
      single: Array.from(moduleSets.single),
      recommended: Array.from(moduleSets.recommended),
    };
  }

  static filterModulesByCompletion(
    modules: (ReturnType<typeof this.getSingleModuleInfo> | null)[],
    showCompleted: boolean,
    courseOutline: CourseOutline,
    moduleProgress: { [key: string]: number }
  ): StudyPlan[] {
    return this.filterStudyPlansByCompletion(
      modules.map((m) => ({
        id: null,
        title: m?.module.title || "",
        user_id: "",
        study_plan_chapters: [],
        study_plan_type: "",
        metadata: {},
      })),
      showCompleted,
      courseOutline,
      moduleProgress
    );
  }

  // Module Info page
  static isModuleInStudyPlan(studyPlans: StudyPlan[], fieldName: string, moduleName: string): boolean {
    console.log(studyPlans);
    console.log(fieldName);
    console.log(moduleName);
    return studyPlans.some(plan =>
      plan.study_plan_chapters.some(chapter =>
        chapter.module_name === moduleName
      )
    );
  }

  // Leveling system
  static calculateUserExperience(studyProgress: StudyProgress): UserExperience {
    // Handle the case where the study progress is empty
    if (!studyProgress?.progress?.fields || Object.keys(studyProgress.progress.fields).length === 0) {
      return {
        totalXP: 0,
        level: 1,
        rank: this.getRank(1),
        levelExperience: 0,
        requiredExperience: this.calculateLevelDetails(0).requiredExperience,
        dailyExperience: [],
        weeklyExperience: []
      };
    }

    const dailyExperience: DailyExperience[] = [];
    const weeklyExperience: WeeklyExperience[] = [];
    let totalXP = 0;

    // Process daily experience
    const progressByDate = new Map<string, number>();

    Object.values(studyProgress.progress.fields).forEach(field => {
      Object.values(field.modules).forEach(module => {
        Object.values(module.chapters).forEach(chapter => {
          Object.values(chapter.discussion_points).forEach(dp => {
            Object.values(dp.subtopics).forEach(subtopic => {
              if (subtopic.status === "DONE") {
                const date = subtopic.completion_datetime.split('T')[0];
                progressByDate.set(date, (progressByDate.get(date) || 0) + 1);
              }
            });
          });
        });
      });
    });

    // Calculate daily XP and challenges
    progressByDate.forEach((subtopicsCompleted, date) => {
      let dailyXP = subtopicsCompleted > 0 ? 20 + (subtopicsCompleted - 1) * 10 : 0;

      // Daily challenges
      // if (subtopicsCompleted >= 20) dailyXP += 200;
      if (subtopicsCompleted >= 10) dailyXP += 80;
      else if (subtopicsCompleted >= 5) dailyXP += 30;

      dailyExperience.push({ date, subtopicsCompleted, experienceGained: dailyXP });
      totalXP += dailyXP;

      console.log(`Daily exp added ${dailyXP}, subtopicsCompleted: ${subtopicsCompleted}`)
    });

    // Calculate weekly challenges
    const weekMap = new Map<string, Set<string>>();
    dailyExperience.forEach(day => {
      const date = new Date(day.date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0];
      if (!weekMap.has(weekStart)) weekMap.set(weekStart, new Set());
      weekMap.get(weekStart)!.add(day.date);
    });

    console.log(weekMap);
    weekMap.forEach((daysLearned, weekStartDate) => {
      let weeklyXP = 0;
      // if (daysLearned.size >= 7) weeklyXP = 0;
      if (daysLearned.size >= 5) weeklyXP = 100;
      else if (daysLearned.size >= 3) weeklyXP = 50;

      if (weeklyXP > 0) {
        weeklyExperience.push({ weekStartDate, daysLearned: daysLearned.size, experienceGained: weeklyXP });
        totalXP += weeklyXP;

        console.log(`Weekly exp added ${weeklyXP}, daysLearned: ${daysLearned}`)
      }
    });

    // Calculate level, experience within current level, and experience needed for next level
    const { level, levelExperience, requiredExperience } = this.calculateLevelDetails(totalXP);
    const rank = this.getRank(level);

    return {
      totalXP,
      level,
      rank,
      levelExperience,
      requiredExperience,
      dailyExperience,
      weeklyExperience
    };
  }

  private static calculateLevelDetails(totalXP: number): {
    level: number;
    levelExperience: number;
    requiredExperience: number;
  } {
    let level = 1;
    let remainingXP = totalXP;
    let requiredForNext = this.xpRequiredForNextLevel(level);

    // Find current level and remaining XP
    while (remainingXP >= requiredForNext) {
      remainingXP -= requiredForNext;
      level++;
      requiredForNext = this.xpRequiredForNextLevel(level);
    }

    return {
      level,
      levelExperience: remainingXP,
      requiredExperience: requiredForNext
    };
  }

  private static calculateLevel(xp: number): number {
    let level = 1;
    while (xp >= this.xpRequiredForNextLevel(level)) {
      xp -= this.xpRequiredForNextLevel(level);
      level++;
    }
    return level;
  }

  private static xpRequiredForNextLevel(currentLevel: number): number {
    return Math.floor(100 * Math.pow(currentLevel, 1.5));
  }

  private static getRank(level: number): string {
    const ranks = [
      "Intern I", "Intern II", "Intern III",
      "Junior Developer I", "Junior Developer II", "Junior Developer III",
      "Software Developer I", "Software Developer II", "Software Developer III",
      "Senior Developer I", "Senior Developer II", "Senior Developer III",
      "Lead Developer I", "Lead Developer II", "Lead Developer III",
      "Software Architect I", "Software Architect II",
      "Principal Engineer I", "Principal Engineer II", "Principal Engineer III"
    ];
    return ranks[Math.min(level - 1, ranks.length - 1)];
  }

  // Challenge system
  static getChallenges(studyProgress: StudyProgress): Challenges {
    const today = new Date();
    const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    const currentWeekStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - today.getUTCDay()));

    const dailyProgress = this.getDailyProgress(studyProgress, utcToday.toISOString().split('T')[0]);
    const weeklyProgress = this.getWeeklyProgress(studyProgress, currentWeekStart.toISOString().split('T')[0]);

    return {
      daily: this.getDailyChallenges(dailyProgress),
      weekly: this.getWeeklyChallenges(weeklyProgress)
    };
  }

  private static getDailyProgress(studyProgress: StudyProgress, date: string): number {
    if (!studyProgress?.progress?.fields || Object.keys(studyProgress.progress.fields).length === 0) {
      return 0;
    }

    let subtopicsCompleted = 0;

    Object.values(studyProgress.progress.fields).forEach(field => {
      Object.values(field.modules).forEach(module => {
        Object.values(module.chapters).forEach(chapter => {
          Object.values(chapter.discussion_points).forEach(dp => {
            Object.values(dp.subtopics).forEach(subtopic => {
              if (subtopic.status === "DONE" && subtopic.completion_datetime.startsWith(date)) {
                subtopicsCompleted++;
              }
            });
          });
        });
      });
    });

    return subtopicsCompleted;
  }

  private static getWeeklyProgress(studyProgress: StudyProgress, weekStartDate: string): number {
    if (!studyProgress?.progress?.fields || Object.keys(studyProgress.progress.fields).length === 0) {
      return 0;
    }

    const daysLearned = new Set<string>();

    Object.values(studyProgress.progress.fields).forEach(field => {
      Object.values(field.modules).forEach(module => {
        Object.values(module.chapters).forEach(chapter => {
          Object.values(chapter.discussion_points).forEach(dp => {
            Object.values(dp.subtopics).forEach(subtopic => {
              if (subtopic.status === "DONE") {
                const completionDate = new Date(subtopic.completion_datetime);
                const completionWeekStart = new Date(completionDate.setDate(completionDate.getDate() - completionDate.getDay())).toISOString().split('T')[0];
                if (completionWeekStart === weekStartDate) {
                  daysLearned.add(subtopic.completion_datetime.split('T')[0]);
                }
              }
            });
          });
        });
      });
    });

    return daysLearned.size;
  }

  private static getDailyChallenges(progress: number): ChallengeSet {
    const challenges: Challenge[] = [
      { id: 'daily1', description: 'Finish 5  topics', xpReward: 30, progress, goal: 5 },
      { id: 'daily2', description: 'Finish 10 topics', xpReward: 80, progress, goal: 10 },
      // { id: 'daily3', description: 'Finish 20 topics', xpReward: 200, progress, goal: 20 }
    ];

    return this.categorizeChallenges(challenges);
  }

  private static getWeeklyChallenges(progress: number): ChallengeSet {
    const challenges: Challenge[] = [
      { id: 'weekly1', description: 'Learn for 3 days', xpReward: 50, progress, goal: 3 },
      { id: 'weekly2', description: 'Learn for 5 days', xpReward: 100, progress, goal: 5 },
      // { id: 'weekly3', description: 'Learn for 7 days', xpReward: 200, progress, goal: 7 }
    ];

    return this.categorizeChallenges(challenges);
  }

  private static categorizeChallenges(challenges: Challenge[]): ChallengeSet {
    const inProgress: Challenge[] = [];
    const completed: Challenge[] = [];

    challenges.forEach(challenge => {
      if (challenge.progress >= challenge.goal) {
        completed.push(challenge);
      } else {
        inProgress.push(challenge);
      }
    });

    return { inProgress, completed };
  }
}
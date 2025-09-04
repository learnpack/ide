import { ITelemetryJSONSchema, TStep } from "../managers/telemetry";

const ALGO_VERSION = 1.0;

interface Indicator {
  name: string;
  calculateStepIndicator(step: TStep, stepMetrics: StepMetrics): number;
  calculateGlobalIndicator(
    stepIndicators: number[],
    globalMetrics: GlobalMetrics
  ): number;
}

export type StepMetrics = {
  status: string;
  time_spent: number;
  total_duration: number;
  comp_struggles: number;
  comp_success: number;
  total_comp_attempts: number;
  test_struggles: number;
  test_success: number;
  total_test_attempts: number;
  quiz_struggles: number;
  quiz_success: number;
  total_quiz_attempts: number;
  streak_comp_struggles: number;
  streak_comp_success: number;
  streak_test_struggle: number;
  streak_test_success: number;
  streak_quiz_struggles: number;
  streak_quiz_success: number;
  user_skipped: boolean;
  total_ai_interactions: number;
  ai_used: boolean;
  is_abandoned: boolean;
};

export type TStepIndicators = {
  // slug: string;
  metrics: StepMetrics;
  indicators: TIndicators;
};

export type TIndicators = {
  engagement_indicator: number;
  frustration_indicator: number;
};

export type GlobalMetrics = {
  total_time_on_platform: number;
  num_sessions: number;
  completion_rate: number;
  total_interactions: number;
  steps_not_completed: number;
  time_on_incomplete: number;
  avg_comp_struggles: number;
  avg_test_struggles: number;
  skipped_steps: number;
  total_steps: number;
  global_test_success_streak: number;
};

type IndicatorResults = {
  algo_version: number;
  global: {
    metrics: GlobalMetrics;
    indicators: TIndicators;
  };
  steps: TStepIndicators[];
};

// ---------------------- Indicadores ----------------------

class engagement_indicator implements Indicator {
  name = "engagement_indicator";

  calculateStepIndicator(step: TStep, stepMetrics: StepMetrics): number {
    // console.debug(step, "Step", stepMetrics, "Step Metrics");
    step;
    const maxTimePerStep = 3600;
    return stepMetrics.status !== "skipped" && stepMetrics.status !== "unread"
      ? Math.min((stepMetrics.time_spent / maxTimePerStep) * 100, 100)
      : 0;
  }

  calculateGlobalIndicator(
    stepIndicators: number[],
    globalMetrics: GlobalMetrics
  ): number {
    stepIndicators;

    const weights = {
      total_time: 0.3,
      num_sessions: 0.2,
      completion_rate: 0.3,
      interactions: 0.2,
    };
    const normTotalTime =
      Math.min(globalMetrics.total_time_on_platform / 36000, 1) * 100;
    const normNumSessions = Math.min(globalMetrics.num_sessions / 5, 1) * 100;
    const normCompletionRate = globalMetrics.completion_rate;
    const normInteractions =
      Math.min(globalMetrics.total_interactions / 100, 1) * 100;

    return (
      ((normTotalTime * weights.total_time +
        normNumSessions * weights.num_sessions +
        normCompletionRate * weights.completion_rate +
        normInteractions * weights.interactions) /
        100) *
      100
    );
  }
}

class frustration_indicator implements Indicator {
  name = "frustration_indicator";
  calculateStepIndicator(step: TStep, stepMetrics: StepMetrics): number {
    step;
    // console.debug(step, "Step", stepMetrics, "Step Metrics");
    if (stepMetrics.status === "completed") {
      return Math.min(
        ((stepMetrics.comp_struggles + stepMetrics.test_struggles) / 20) * 100,
        100
      );
    }
    if (stepMetrics.status === "attempted") {
      return Math.min((stepMetrics.time_spent / 1800) * 100, 100);
    }
    if (stepMetrics.status === "skipped") {
      return 25.0;
    }
    return 0.0;
  }

  calculateGlobalIndicator(
    stepIndicators: number[],
    globalMetrics: GlobalMetrics
  ): number {
    // console.debug(stepIndicators, "Step Indicators");
    stepIndicators;
    const weights = {
      steps_not_completed: 0.3,
      time_on_incomplete: 0.2,
      avg_comp_struggles: 0.2,
      avg_test_struggles: 0.2,
      skipped_steps: 0.1,
    };

    const normStepsNotCompleted =
      globalMetrics.total_steps > 0
        ? (globalMetrics.steps_not_completed / globalMetrics.total_steps) * 100
        : 0;
    const normTimeOnIncomplete =
      Math.min(globalMetrics.time_on_incomplete / 18000, 1) * 100;
    const normAvgCompStruggles =
      Math.min(globalMetrics.avg_comp_struggles / 10, 1) * 100;
    const normAvgTestStruggles =
      Math.min(globalMetrics.avg_test_struggles / 10, 1) * 100;
    const normSkippedSteps =
      globalMetrics.total_steps > 0
        ? (globalMetrics.skipped_steps / globalMetrics.total_steps) * 100
        : 0;

    return (
      ((normStepsNotCompleted * weights.steps_not_completed +
        normTimeOnIncomplete * weights.time_on_incomplete +
        normAvgCompStruggles * weights.avg_comp_struggles +
        normAvgTestStruggles * weights.avg_test_struggles +
        normSkippedSteps * weights.skipped_steps) /
        100) *
      100
    );
  }
}

// ---------------------- Cálculo de métricas ----------------------
function calculateStepMetrics(step: TStep): StepMetrics {
  // Sessions: calculate total session duration in seconds
  let total_duration = 0;
  if (step.sessions && step.sessions.length > 0) {
    total_duration = step.sessions.reduce((acc, curr) => acc + curr, 0);
  }

  let time_spent = total_duration;
  if (!total_duration && step.completed_at && step.opened_at) {
    time_spent = step.completed_at - step.opened_at;
    total_duration = time_spent;
  }

  let status = step.completed_at
    ? "completed"
    : step.opened_at
    ? "attempted"
    : "unread";

  // Compilation struggles/success
  const comp_struggles =
    step.compilations?.filter((c) => c.exit_code !== 0).length || 0;
  const comp_success =
    step.compilations?.filter((c) => c.exit_code === 0).length || 0;

  // Test struggles/success
  const test_struggles =
    step.tests?.filter((t) => t.exit_code !== 0).length || 0;
  const test_success = step.tests?.filter((t) => t.exit_code === 0).length || 0;

  // Quiz struggles/success
  const quiz_struggles =
    step.quiz_submissions?.filter((q) => q.status === "ERROR").length || 0;
  const quiz_success =
    step.quiz_submissions?.filter((q) => q.status === "SUCCESS").length || 0;

  // Streaks for compilations
  let streak_comp_struggles = 0;
  let streak_comp_success = 0;
  for (let i = step.compilations?.length - 1; i >= 0; i--) {
    if (step.compilations[i].exit_code !== 0) streak_comp_struggles++;
    else break;
  }
  for (let i = step.compilations?.length - 1; i >= 0; i--) {
    if (step.compilations[i].exit_code === 0) streak_comp_success++;
    else break;
  }

  // Streaks for tests
  let streak_test_struggle = 0;
  let streak_test_success = 0;
  for (let i = step.tests?.length - 1; i >= 0; i--) {
    if (step.tests[i].exit_code !== 0) streak_test_struggle++;
    else break;
  }
  for (let i = step.tests?.length - 1; i >= 0; i--) {
    if (step.tests[i].exit_code === 0) streak_test_success++;
    else break;
  }

  // Streaks for quizzes
  let streak_quiz_struggles = 0;
  let streak_quiz_success = 0;
  for (let i = step.quiz_submissions?.length - 1; i >= 0; i--) {
    if (step.quiz_submissions[i].status === "ERROR") streak_quiz_struggles++;
    else break;
  }
  for (let i = step.quiz_submissions?.length - 1; i >= 0; i--) {
    if (step.quiz_submissions[i].status === "SUCCESS") streak_quiz_success++;
    else break;
  }

  // user_skipped logic
  const is_testeable =
    step.is_testeable ||
    (step.testeable_elements && step.testeable_elements.length > 0);
  const did_nothing =
    (step.quiz_submissions?.length || 0) === 0 &&
    (step.tests?.length || 0) === 0 &&
    (step.compilations?.length || 0) === 0;
  const user_skipped = !!is_testeable && did_nothing;

  // AI interactions
  const total_ai_interactions = step.ai_interactions?.length || 0;

  const is_abandoned =
    comp_struggles + test_struggles + quiz_struggles > 0 &&
    comp_success + test_success + quiz_success === 0;

  return {
    status,
    time_spent,
    total_duration,
    comp_struggles,
    comp_success,
    total_comp_attempts: comp_success + comp_struggles,
    test_struggles,
    test_success,
    total_test_attempts: test_success + test_struggles,
    quiz_struggles,
    quiz_success,
    total_quiz_attempts: quiz_success + quiz_struggles,
    streak_comp_struggles,
    streak_comp_success,
    streak_test_struggle,
    streak_test_success,
    streak_quiz_struggles,
    streak_quiz_success,
    user_skipped,
    total_ai_interactions,
    ai_used: total_ai_interactions > 0,
    is_abandoned,
  };
}

function calculateGlobalMetrics(steps: TStep[]): GlobalMetrics {
  const total_steps = steps.length;
  const stepMetrics = steps.map(calculateStepMetrics);

  const num_completed = stepMetrics.filter(
    (s) => s.status === "completed"
  ).length;
  const num_attempted = stepMetrics.filter(
    (s) => s.status === "attempted"
  ).length;
  const num_skipped = stepMetrics.filter((s) => s.status === "skipped").length;

  const num_unread = stepMetrics.filter((s) => s.status === "unread").length;
  const completion_rate = total_steps ? (num_completed / total_steps) * 100 : 0;
  const total_interactions = steps.reduce(
    (sum, step) =>
      sum +
      (step.compilations?.length || 0) +
      (step.tests?.length || 0) +
      (step.quiz_submissions?.length || 0) +
      (step.ai_interactions?.length || 0),
    0
  );
  const total_time_on_platform = stepMetrics.reduce(
    (sum, sm) => sum + sm.time_spent,
    0
  );
  const steps_not_completed = num_attempted + num_skipped + num_unread;
  const avg_comp_struggles = total_steps
    ? stepMetrics.reduce((sum, sm) => sum + sm.comp_struggles, 0) / total_steps
    : 0;
  const avg_test_struggles = total_steps
    ? stepMetrics.reduce((sum, sm) => sum + sm.test_struggles, 0) / total_steps
    : 0;

  // Cálculo de global_test_success_streak
  let global_test_success_streak = 0;
  for (const step of steps) {
    let local_streak = 0;
    for (const test of step.tests || []) {
      if (test.exit_code === 0) local_streak++;
      else local_streak = 0;
      global_test_success_streak = Math.max(
        global_test_success_streak,
        local_streak
      );
    }
  }

  return {
    total_time_on_platform,
    num_sessions: 1,
    completion_rate,
    total_interactions,
    steps_not_completed,
    time_on_incomplete: total_time_on_platform,
    avg_comp_struggles,
    avg_test_struggles,
    skipped_steps: num_skipped,
    total_steps,
    global_test_success_streak,
  };
}

// ---------------------- Función principal ----------------------

export function calculateIndicators(
  telemetry: ITelemetryJSONSchema
): IndicatorResults {
  const indicators = [new engagement_indicator(), new frustration_indicator()];

  const stepMetricsList = telemetry.steps.map((step) =>
    calculateStepMetrics(step)
  );
  const globalMetrics = calculateGlobalMetrics(telemetry.steps);

  const stepsResults = telemetry.steps.map((step, index) => {
    const metrics = stepMetricsList[index];
    const indicatorsResult: TIndicators = {
      engagement_indicator: 0,
      frustration_indicator: 0,
    };

    indicators.forEach((indicator) => {
      indicatorsResult[indicator.name as keyof TIndicators] =
        indicator.calculateStepIndicator(step, metrics);
    });

    return { slug: step.slug, metrics, indicators: indicatorsResult };
  });

  const globalIndicators: TIndicators = {
    engagement_indicator: 0,
    frustration_indicator: 0,
  };
  indicators.forEach((indicator) => {
    globalIndicators[indicator.name as keyof TIndicators] =
      indicator.calculateGlobalIndicator(
        stepsResults.map(
          (step) => step.indicators[indicator.name as keyof TIndicators]
        ),
        globalMetrics
      );
  });

  return {
    algo_version: ALGO_VERSION,
    global: { metrics: globalMetrics, indicators: globalIndicators },
    steps: stepsResults,
  };
}

// --- TEST METRICS
export type TTesteableElementMetrics = {
  started_at: number;
  ended_at: number;
  resolution_time_seconds: number;
  n_ai_interactions: number;
  n_tries: number;
  n_fail: number;
  n_success: number;
};

export function calculateTestMetrics(
  step: TStep,
  hash: string
): TTesteableElementMetrics | undefined {
  if (!step.testeable_elements) {
    return undefined;
  }
  const element = step.testeable_elements.find((e) => e.hash === hash);
  if (!element) {
    return undefined;
  }

  const started_at =
    element.type === "quiz"
      ? step.quiz_submissions.find((s) => s.quiz_hash === hash)?.ended_at ||
        step.opened_at ||
        0
      : step.tests.shift()?.started_at || step.opened_at || 0;

  const ended_at =
    element.type === "quiz"
      ? step.quiz_submissions.findLast((s) => s.quiz_hash === hash)?.ended_at ||
        step.completed_at ||
        1
      : step.tests.shift()?.started_at || step.completed_at || 1;

  const resolution_time_seconds = Number((ended_at - started_at)/1000);

  const n_ai_interactions = step.ai_interactions.filter(
    (a) => a.started_at >= started_at && a.ended_at <= ended_at
  ).length;

  const n_tries =
    element.type === "quiz"
      ? step.quiz_submissions.filter((s) => s.quiz_hash === hash).length
      : step.tests.length;

  const n_fail =
    element.type === "quiz"
      ? step.quiz_submissions.filter(
          (s) => s.quiz_hash === hash && s.status === "ERROR"
        ).length
      : step.tests.filter((t) => t.exit_code !== 1).length;

  const n_success =
    element.type === "quiz"
      ? step.quiz_submissions.filter(
          (s) => s.quiz_hash === hash && s.status === "SUCCESS"
        ).length
      : step.tests.filter((t) => t.exit_code === 1).length;

  return {
    started_at,
    ended_at,
    resolution_time_seconds,
    n_ai_interactions,
    n_tries,
    n_fail,
    n_success,
  };
}

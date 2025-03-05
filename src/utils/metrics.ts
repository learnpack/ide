import { ITelemetryJSONSchema, TStep } from "../managers/telemetry";

const ALGO_VERSION = 1.0;

interface Indicator {
  calculateStepIndicator(step: TStep, stepMetrics: StepMetrics): number;
  calculateGlobalIndicator(
    stepIndicators: number[],
    globalMetrics: GlobalMetrics
  ): number;
}

type StepMetrics = {
  status: string;
  time_spent: number;
  comp_struggles: number;
  test_struggles: number;
};

type GlobalMetrics = {
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
};

type IndicatorResults = {
  algo_version: number;
  global: {
    metrics: GlobalMetrics;
    indicators: Record<string, number>;
  };
  steps: {
    slug: string;
    metrics: StepMetrics;
    indicators: Record<string, number>;
  }[];
};

// ---------------------- Indicadores ----------------------

class EngagementIndicator implements Indicator {
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
    console.debug(stepIndicators, "Step Indicators");

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

class FrustrationIndicator implements Indicator {
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
    console.debug(stepIndicators, "Step Indicators");

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
  let status = step.completed_at
    ? "completed"
    : step.opened_at
    ? "attempted"
    : "unread";
  const time_spent =
    step.completed_at && step.opened_at
      ? (step.completed_at - step.opened_at) / 1000
      : 0;
  const comp_struggles =
    step.compilations?.filter((c) => c.exit_code !== 0).length || 0;
  const test_struggles =
    step.tests?.filter((t) => t.exit_code !== 0).length || 0;

  return { status, time_spent, comp_struggles, test_struggles };
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
  const completion_rate = total_steps ? (num_completed / total_steps) * 100 : 0;
  const total_interactions = steps.reduce(
    (sum, step) =>
      sum + (step.compilations?.length || 0) + (step.tests?.length || 0),
    0
  );
  const total_time_on_platform = stepMetrics.reduce(
    (sum, sm) => sum + sm.time_spent,
    0
  );
  const steps_not_completed = num_attempted + num_skipped;
  const avg_comp_struggles = total_steps
    ? stepMetrics.reduce((sum, sm) => sum + sm.comp_struggles, 0) / total_steps
    : 0;
  const avg_test_struggles = total_steps
    ? stepMetrics.reduce((sum, sm) => sum + sm.test_struggles, 0) / total_steps
    : 0;

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
  };
}

// ---------------------- Función principal ----------------------

export function calculateIndicators(
  telemetry: ITelemetryJSONSchema
): IndicatorResults {
  const indicators = [new EngagementIndicator(), new FrustrationIndicator()];

  const stepMetricsList = telemetry.steps.map((step) =>
    calculateStepMetrics(step)
  );
  const globalMetrics = calculateGlobalMetrics(telemetry.steps);

  const stepsResults = telemetry.steps.map((step, index) => {
    const metrics = stepMetricsList[index];
    const indicatorsResult: Record<string, number> = {};

    indicators.forEach((indicator) => {
      indicatorsResult[indicator.constructor.name] =
        indicator.calculateStepIndicator(step, metrics);
    });

    return { slug: step.slug, metrics, indicators: indicatorsResult };
  });

  const globalIndicators: Record<string, number> = {};
  indicators.forEach((indicator) => {
    globalIndicators[indicator.constructor.name] =
      indicator.calculateGlobalIndicator(
        stepsResults.map((step) => step.indicators[indicator.constructor.name]),
        globalMetrics
      );
  });

  return {
    algo_version: ALGO_VERSION,
    global: { metrics: globalMetrics, indicators: globalIndicators },
    steps: stepsResults,
  };
}

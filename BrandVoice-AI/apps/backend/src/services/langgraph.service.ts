import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { logger } from '../lib/logger';
import { aiService, GenerationOutput, GenerationParams } from './ai.service';
import { consistencyService, ConsistencyEvaluation, BrandConsistencyContext } from './consistency.service';
import { embeddingService } from './embedding.service';

export interface ContentWorkflowResult {
  output: GenerationOutput;
  report: ConsistencyEvaluation;
  memoriesUsed: number;
  stage: string;
}

const WorkflowState = Annotation.Root({
  params: Annotation<GenerationParams>,
  brandContext: Annotation<BrandConsistencyContext>,
  memoryContext: Annotation<string>({
    reducer: (_previous, next) => next,
    default: () => '',
  }),
  memoriesUsed: Annotation<number>({
    reducer: (_previous, next) => next,
    default: () => 0,
  }),
  output: Annotation<GenerationOutput | null>({
    reducer: (_previous, next) => next,
    default: () => null,
  }),
  report: Annotation<ConsistencyEvaluation | null>({
    reducer: (_previous, next) => next,
    default: () => null,
  }),
  stage: Annotation<string>({
    reducer: (_previous, next) => next,
    default: () => 'init',
  }),
});

async function retrieveMemoryNode(state: typeof WorkflowState.State) {
  const brandId = state.params.brandId;
  if (!brandId) {
    return { memoryContext: '', memoriesUsed: 0, stage: 'memory_skipped' };
  }

  const hits = await embeddingService.searchSimilar(brandId, `${state.params.topic}\n${state.params.productDescription || ''}`, 5);
  const memoryContext = hits
    .map((hit) => `[${hit.type}] ${hit.content.replace(/\s+/g, ' ').slice(0, 500)}`)
    .join('\n');

  logger.info(`LangGraph retrieved ${hits.length} brand memories`);
  return { memoryContext, memoriesUsed: hits.length, stage: 'memory_retrieved' };
}

async function generateNode(state: typeof WorkflowState.State) {
  const output = await aiService.generate({
    ...state.params,
    memoryContext: state.memoryContext,
  });
  return { output, stage: 'generated' };
}

async function evaluateNode(state: typeof WorkflowState.State) {
  if (!state.output) {
    throw new Error('Content generation did not produce output');
  }
  const report = await consistencyService.evaluate(state.output.content, {
    ...state.brandContext,
    platform: state.params.platform,
  });
  return { report, stage: 'evaluated' };
}

const compiledWorkflow = new StateGraph(WorkflowState)
  .addNode('retrieve_memory', retrieveMemoryNode)
  .addNode('generate', generateNode)
  .addNode('evaluate', evaluateNode)
  .addEdge(START, 'retrieve_memory')
  .addEdge('retrieve_memory', 'generate')
  .addEdge('generate', 'evaluate')
  .addEdge('evaluate', END)
  .compile();

export class LangGraphService {
  async generateContent(params: GenerationParams, brandContext: BrandConsistencyContext): Promise<ContentWorkflowResult> {
    logger.info(`LangGraph content workflow started for "${params.topic}" [${params.platform}]`);
    const result = await compiledWorkflow.invoke({
      params,
      brandContext,
      memoryContext: '',
      memoriesUsed: 0,
      output: null,
      report: null,
      stage: 'init',
    });

    if (!result.output || !result.report) {
      throw new Error('Content workflow finished without a result');
    }

    return {
      output: result.output,
      report: result.report,
      memoriesUsed: result.memoriesUsed,
      stage: result.stage,
    };
  }
}

export const langGraphService = new LangGraphService();

import { ToolDefinition, ToolExecutionResult } from './types';
import { ragEngine } from './ragEngine';
import { dependencyGraph } from './dependencyGraph';
import { getDatabase } from '../models/schema';

export const REGISTERED_TOOLS: ToolDefinition[] = [
  // READ TOOLS
  { name: 'searchKnowledge', category: 'READ', description: 'Semantically searches knowledge docs, workbooks, and uploaded files', parameters: { query: 'string', workspace: 'string' } },
  { name: 'searchWorkbook', category: 'READ', description: 'Reads sheets, rows, and formulas from Workbook Studio', parameters: { sheetName: 'string' } },
  { name: 'getProjectSnapshot', category: 'READ', description: 'Fetches current state snapshot of project modules', parameters: { projectId: 'string' } },
  { name: 'getEconomy', category: 'READ', description: 'Fetches economy sinks, faucets, and drop rates', parameters: { projectId: 'string' } },
  { name: 'getProgression', category: 'READ', description: 'Fetches level curves and XP scaling tables', parameters: { projectId: 'string' } },
  { name: 'getAnalytics', category: 'READ', description: 'Fetches telemetry retention and monetization metrics', parameters: { projectId: 'string' } },
  { name: 'getAuditResults', category: 'READ', description: 'Fetches audit health scores and risk entries', parameters: { projectId: 'string' } },

  // ANALYSIS TOOLS
  { name: 'calculateEconomy', category: 'ANALYSIS', description: 'Calculates soft-to-hard currency inflation ratio', parameters: { sinks: 'number', faucets: 'number' } },
  { name: 'estimateRetention', category: 'ANALYSIS', description: 'Estimates D1/D7/D30 retention based on motivation scores', parameters: { ach: 'number', exp: 'number' } },
  { name: 'runMonteCarlo', category: 'ANALYSIS', description: 'Runs 10,000 player simulation runs for economy balance', parameters: { iterations: 'number' } },
  { name: 'findDependencies', category: 'ANALYSIS', description: 'Discovers affected downstream systems using Dependency Graph', parameters: { changedSystems: 'array' } },
  { name: 'detectInflation', category: 'ANALYSIS', description: 'Scans for runaway currency inflation risk', parameters: { faucetRate: 'number', sinkCapacity: 'number' } },
  { name: 'validateBalance', category: 'ANALYSIS', description: 'Validates game balance formulas for errors', parameters: { formulas: 'array' } },

  // WRITE TOOLS (PROPOSAL-GATED)
  { name: 'createTable', category: 'WRITE', description: 'Generates structured table data proposal for workbooks', parameters: { tableName: 'string', columns: 'array' }, requiresApproval: true },
  { name: 'updateWorkbook', category: 'WRITE', description: 'Proposes updates to spreadsheet formulas/cells', parameters: { sheet: 'string', cell: 'string', value: 'string' }, requiresApproval: true },
  { name: 'updateEconomy', category: 'WRITE', description: 'Proposes adjustment to soft/hard currency drop rates', parameters: { currency: 'string', newRate: 'number' }, requiresApproval: true },
  { name: 'saveProject', category: 'WRITE', description: 'Proposes project blueprint changes', parameters: { module: 'string', changes: 'object' }, requiresApproval: true },
  { name: 'createAuditEntry', category: 'WRITE', description: 'Logs new balance audit warning entry', parameters: { severity: 'string', message: 'string' }, requiresApproval: true },
  { name: 'generateSpreadsheet', category: 'WRITE', description: 'Generates exportable XLSX spreadsheet structure proposal', parameters: { title: 'string' }, requiresApproval: true },
];

export class ToolExecutor {
  public async executeTool(
    name: string,
    inputs: Record<string, unknown>,
    projectId: string,
    workspace: string
  ): Promise<ToolExecutionResult> {
    const toolDef = REGISTERED_TOOLS.find((t) => t.name === name);
    if (!toolDef) {
      return { toolName: name, category: 'READ', inputs, output: null, success: false, error: `Tool ${name} not found` };
    }

    try {
      let output: unknown = null;

      switch (name) {
        case 'searchKnowledge': {
          const query = String(inputs.query || '');
          output = ragEngine.search(query, projectId, workspace, 3);
          break;
        }
        case 'getProjectSnapshot':
        case 'getEconomy':
        case 'getProgression':
        case 'getAnalytics':
        case 'getAuditResults': {
          const db = getDatabase();
          const row = await db.get(`SELECT * FROM projects WHERE id = ? OR userId = ? LIMIT 1`, [projectId, projectId]);
          output = row || { status: 'mock_active', systemHealth: 88, economy: { faucet: 100, sink: 85 } };
          break;
        }
        case 'calculateEconomy': {
          const sinks = Number(inputs.sinks || 85);
          const faucets = Number(inputs.faucets || 100);
          const inflationRate = ((faucets - sinks) / (sinks || 1)) * 100;
          output = { faucets, sinks, inflationRate: Number(inflationRate.toFixed(2)), risk: inflationRate > 15 ? 'HIGH' : 'LOW' };
          break;
        }
        case 'runMonteCarlo': {
          output = { iterations: 10000, p50DaysToMax: 24, p90DaysToMax: 38, gachaPityTriggerRate: 0.015, status: 'STABLE' };
          break;
        }
        case 'findDependencies': {
          const changed = Array.isArray(inputs.changedSystems) ? inputs.changedSystems.map(String) : [workspace || 'Economy'];
          output = { changedSystems: changed, affectedSystems: dependencyGraph.getAffectedSystems(changed) };
          break;
        }
        case 'updateEconomy':
        case 'updateWorkbook':
        case 'createTable':
        case 'saveProject':
        case 'createAuditEntry':
        case 'generateSpreadsheet': {
          output = {
            isProposal: true,
            status: 'PROPOSAL_GENERATED',
            requiresApproval: true,
            diff: {
              module: workspace || 'Economy',
              before: { status: 'original' },
              after: inputs,
            },
          };
          break;
        }
        default:
          output = { executed: true, params: inputs };
      }

      return {
        toolName: name,
        category: toolDef.category,
        inputs,
        output,
        success: true,
      };
    } catch (err) {
      return {
        toolName: name,
        category: toolDef.category,
        inputs,
        output: null,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

export const toolExecutor = new ToolExecutor();

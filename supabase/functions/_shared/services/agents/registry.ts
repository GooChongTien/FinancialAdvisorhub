import type { MiraModule } from "../types.ts";
import { SkillAgent } from "./base-agent.ts";
import { CustomerAgent } from "./customer-agent.ts";
import { NewBusinessAgent } from "./new-business-agent.ts";
import { ProductAgent } from "./product-agent.ts";
import { AnalyticsAgent } from "./analytics-agent.ts";
import { ToDoAgent } from "./todo-agent.ts";
import { BroadcastAgent } from "./broadcast-agent.ts";
import { VisualizerAgent } from "./visualizer-agent.ts";

export class AgentRegistry {
  private readonly agentsById = new Map<string, SkillAgent>();
  private readonly agentsByModule = new Map<MiraModule, SkillAgent>();

  registerAgent(agent: SkillAgent): void {
    this.agentsById.set(agent.id, agent);
    this.agentsByModule.set(agent.module, agent);
  }

  getAgentByModule(module: MiraModule): SkillAgent | null {
    return this.agentsByModule.get(module) ?? null;
  }

  getAgentById(agentId: string): SkillAgent | null {
    return this.agentsById.get(agentId) ?? null;
  }

  getAllAgents(): SkillAgent[] {
    return [...this.agentsById.values()];
  }
}

const registry = new AgentRegistry();
registry.registerAgent(new CustomerAgent());
registry.registerAgent(new NewBusinessAgent());
registry.registerAgent(new ProductAgent());
registry.registerAgent(new AnalyticsAgent());
registry.registerAgent(new ToDoAgent());
registry.registerAgent(new BroadcastAgent());
registry.registerAgent(new VisualizerAgent());

export function getAgentRegistry(): AgentRegistry {
  return registry;
}

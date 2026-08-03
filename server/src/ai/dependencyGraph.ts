export class DependencyGraph {
  private adjacencyMap: Map<string, Set<string>> = new Map();

  constructor() {
    this.buildDefaultGraph();
  }

  private buildDefaultGraph(): void {
    // Economy -> Progression -> Retention -> Analytics -> Simulation
    this.addDependency('Economy', 'Progression');
    this.addDependency('Economy', 'Simulation');
    this.addDependency('Progression', 'Retention');
    this.addDependency('Progression', 'Simulation');
    this.addDependency('Retention', 'Analytics');
    this.addDependency('Analytics', 'Simulation');
    this.addDependency('Systems', 'Economy');
    this.addDependency('Systems', 'Progression');
    this.addDependency('Blueprint', 'Systems');
  }

  public addDependency(fromSystem: string, toSystem: string): void {
    if (!this.adjacencyMap.has(fromSystem)) {
      this.adjacencyMap.set(fromSystem, new Set());
    }
    this.adjacencyMap.get(fromSystem)!.add(toSystem);
  }

  public getAffectedSystems(changedSystems: string[]): string[] {
    const affected = new Set<string>();
    const queue = [...changedSystems];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const dependents = this.adjacencyMap.get(current);
      if (dependents) {
        for (const dep of dependents) {
          if (!affected.has(dep) && !changedSystems.includes(dep)) {
            affected.add(dep);
            queue.push(dep);
          }
        }
      }
    }

    return Array.from(affected);
  }

  public getGraphRepresentation(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [key, set] of this.adjacencyMap.entries()) {
      result[key] = Array.from(set);
    }
    return result;
  }
}

export const dependencyGraph = new DependencyGraph();

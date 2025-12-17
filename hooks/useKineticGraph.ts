import { useRef } from 'react';
import { AudioAnalysis } from './useAudioPlayer';

export interface KineticNode {
  id: 'idle' | 'lean_left' | 'lean_right' | 'crouch' | 'jump';
  frames?: string[];
  possibleTransitions: { target: KineticNode['id']; weight: number }[];
  energyRequirement: number; // 0-1 energy to enter
  mechanicalFx: 'none' | 'zoom' | 'mirror' | 'stutter';
}

interface KineticGraphState {
  currentNode: KineticNode;
  lastEnergy: number;
  lastTransitionTs: number;
}

const createGraph = (): Map<KineticNode['id'], KineticNode> => {
  return new Map([
    ['idle', {
      id: 'idle',
      possibleTransitions: [
        { target: 'lean_left', weight: 0.35 },
        { target: 'lean_right', weight: 0.35 },
        { target: 'crouch', weight: 0.2 },
        { target: 'jump', weight: 0.1 },
      ],
      energyRequirement: 0,
      mechanicalFx: 'none'
    }],
    ['lean_left', {
      id: 'lean_left',
      possibleTransitions: [
        { target: 'idle', weight: 0.6 },
        { target: 'crouch', weight: 0.2 },
        { target: 'jump', weight: 0.2 },
      ],
      energyRequirement: 0.25,
      mechanicalFx: 'mirror'
    }],
    ['lean_right', {
      id: 'lean_right',
      possibleTransitions: [
        { target: 'idle', weight: 0.6 },
        { target: 'crouch', weight: 0.2 },
        { target: 'jump', weight: 0.2 },
      ],
      energyRequirement: 0.25,
      mechanicalFx: 'mirror'
    }],
    ['crouch', {
      id: 'crouch',
      possibleTransitions: [
        { target: 'idle', weight: 0.5 },
        { target: 'lean_left', weight: 0.25 },
        { target: 'lean_right', weight: 0.25 },
      ],
      energyRequirement: 0.35,
      mechanicalFx: 'stutter'
    }],
    ['jump', {
      id: 'jump',
      possibleTransitions: [
        { target: 'idle', weight: 0.4 },
        { target: 'crouch', weight: 0.35 },
        { target: 'lean_left', weight: 0.125 },
        { target: 'lean_right', weight: 0.125 },
      ],
      energyRequirement: 0.6,
      mechanicalFx: 'zoom'
    }],
  ]);
};

const chooseNext = (
  current: KineticNode,
  graph: Map<KineticNode['id'], KineticNode>,
  predictedEnergy: number,
  lastEnergy: number
): KineticNode => {
  // If energy is too low for current, return idle early
  if (predictedEnergy < current.energyRequirement * 0.75) {
    return graph.get('idle')!;
  }

  const candidates = current.possibleTransitions
    .map(edge => graph.get(edge.target)!)
    .filter(node => predictedEnergy >= node.energyRequirement * 0.9);

  if (candidates.length === 0) return current;

  // Weighted selection to encourage variety but keep direction rules
  const energyMomentum = Math.max(predictedEnergy - lastEnergy, -1);
  const weighted = candidates.map(node => {
    const edge = current.possibleTransitions.find(e => e.target === node.id);
    const baseWeight = edge?.weight || 1;
    // If momentum is upward, favor higher-requirement nodes; otherwise bias idle recovery
    const energyBias = energyMomentum >= 0
      ? (1 + node.energyRequirement * energyMomentum * 1.5)
      : (node.id === 'idle' ? 1.5 : 0.8);
    return { node, weight: baseWeight * energyBias };
  });

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);

  let roll = Math.random() * totalWeight;
  for (const entry of weighted) {
    if (roll < entry.weight) return entry.node;
    roll -= entry.weight;
  }

  return weighted[weighted.length - 1].node;
};

export const useKineticGraph = () => {
  const HOLD_MS = 180;

  const graphRef = useRef<Map<KineticNode['id'], KineticNode>>(createGraph());
  const stateRef = useRef<KineticGraphState>({
    currentNode: graphRef.current.get('idle')!,
    lastEnergy: 0,
    lastTransitionTs: performance.now?.() ?? Date.now(),
  });

  const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

  const advance = (analysis: AudioAnalysis): KineticNode => {
    const predictedEnergy = clamp01(analysis.energy);
    const now = performance.now?.() ?? Date.now();
    const elapsed = now - stateRef.current.lastTransitionTs;

    // Respect minimum hold time so poses do not jitter
    if (elapsed < HOLD_MS) {
      stateRef.current.lastEnergy = predictedEnergy;
      return stateRef.current.currentNode;
    }

    const current = stateRef.current.currentNode;
    const next = chooseNext(current, graphRef.current, predictedEnergy, stateRef.current.lastEnergy);

    // Enforce LeanLeft -> Idle -> LeanRight constraint by not allowing direct swap
    if (
      (current.id === 'lean_left' && next.id === 'lean_right') ||
      (current.id === 'lean_right' && next.id === 'lean_left')
    ) {
      stateRef.current.currentNode = graphRef.current.get('idle')!;
    } else {
      stateRef.current.currentNode = next;
    }

    stateRef.current.lastEnergy = predictedEnergy;
    stateRef.current.lastTransitionTs = now;
    return stateRef.current.currentNode;
  };

  return {
    getCurrentNode: () => stateRef.current.currentNode,
    advance,
  };
};


import { Card, CardContent } from '@/components/ui/card';
import { type InferRouterContractOutputs } from '@orpc/contract';

import { type contract } from '#shared/contracts/index';

type Features = InferRouterContractOutputs<typeof contract>['info']['features'];

/// Presentational feature list. Typed against the contract alone — it never
/// touches the transport layer, so it can be rendered from real RPC data,
/// mock data, or storybook props interchangeably.
const FeatureList = ({ features }: { features: Features }) => {
  if (features.length === 0) {
    return <p className="text-muted-foreground text-sm">No features yet.</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {features.map((feature) => (
        <li key={feature.title}>
          <Card className="h-full">
            <CardContent className="flex gap-3">
              <span aria-hidden="true" className="text-2xl">
                {feature.icon}
              </span>
              <div>
                <p className="font-medium">{feature.title}</p>
                <p className="text-muted-foreground mt-1 text-sm">{feature.description}</p>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
};

export { FeatureList };

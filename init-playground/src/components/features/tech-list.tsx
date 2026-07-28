import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { type InferRouterContractOutputs } from '@orpc/contract';

import { type contract } from '#shared/contracts/index';

type Techs = InferRouterContractOutputs<typeof contract>['info']['techs'];

/// Presentational tech list. Same contract-only typing as `FeatureList`; the
/// data source (real RPC vs mock) is decided at the boundary, never here.
const TechList = ({ techs }: { techs: Techs }) => {
  if (techs.length === 0) {
    return <p className="text-muted-foreground text-sm">No technologies yet.</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {techs.map((tech) => (
        <li key={tech.name}>
          <Card className="h-full">
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <a className="font-semibold underline-offset-4 hover:underline" href={tech.url}>
                  {tech.name}
                </a>
                <Badge variant="secondary">v{tech.version}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{tech.description}</p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
};

export { TechList };

import { os } from '../../server/os';
import { listTechs } from '../../server/services/techs';

export const techs = os.info.techs.handler(async ({ context, errors }) => {
  const result = await listTechs(context.env);
  if (result.isErr()) {
    // oxlint-disable-next-line new-cap -- oRPC error factory (conventionally uppercase)
    throw errors.NOT_FOUND();
  }
  return result.value;
});

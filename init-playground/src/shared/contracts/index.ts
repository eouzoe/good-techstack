import { asyncIteratorObject, oc } from '@orpc/contract';
import { array, literal, minLength, number, object, pipe, string, union, url } from 'valibot';

const nonEmptyString = pipe(string(), minLength(1));
const nonEmptyUrl = pipe(string(), url());

const severitySchema = union([literal('info'), literal('warn'), literal('error')]);

const notificationEvent = object({
  data: object({
    message: nonEmptyString,
    severity: severitySchema,
    title: nonEmptyString,
  }),
  type: literal('notification'),
});

const timestampEvent = object({
  data: object({
    iso: nonEmptyString,
    unix: number(),
  }),
  type: literal('timestamp'),
});

const eventSchema = union([notificationEvent, timestampEvent]);

const featuresContract = oc.output(
  array(
    object({
      description: nonEmptyString,
      icon: nonEmptyString,
      title: nonEmptyString,
    }),
  ),
);

const techsContract = oc
  .errors({
    NOT_FOUND: {
      message: 'No technologies found',
    },
  })
  .output(
    array(
      object({
        description: nonEmptyString,
        name: nonEmptyString,
        url: nonEmptyUrl,
        version: nonEmptyString,
      }),
    ),
  );

const pageMetaContract = oc.output(
  object({
    description: nonEmptyString,
    title: nonEmptyString,
  }),
);

const eventsContract = oc.output(asyncIteratorObject(eventSchema));

const contract = {
  info: {
    events: eventsContract,
    features: featuresContract,
    pageMeta: pageMetaContract,
    techs: techsContract,
  },
};

export { contract, eventsContract, eventSchema, featuresContract, pageMetaContract, techsContract };

import {
  findWorldArea
} from './world-area-model.js?rev=world-event-message-v1';
import {
  resolveWorldTriggerPoint,
  worldTriggerContainsPoint
} from './world-trigger-geometry.js?rev=world-event-message-v1';

function freezeIntent(event) {
  return Object.freeze({
    eventId: event.id,
    action: event.action
  });
}

function eligible(event, consumedIds) {
  return (
    event?.enabled === true &&
    !(
      event.repeatPolicy === 'once' &&
      consumedIds.has(event.id)
    )
  );
}

export function createWorldEventController(
  worldDocument
) {
  const consumedIds = new Set();
  let insideOnEnter = new Set();

  function eventPoint(
    currentAreaId,
    event
  ) {
    if (
      !event ||
      event.sourceAreaId !== currentAreaId
    ) {
      return null;
    }

    const area =
      findWorldArea(
        worldDocument?.areas,
        currentAreaId
      );

    if (!area) return null;

    return resolveWorldTriggerPoint(
      area,
      event.trigger
    );
  }

  function consumeIfNeeded(event) {
    if (event.repeatPolicy === 'once') {
      consumedIds.add(event.id);
    }
  }

  function step({
    currentAreaId,
    entity
  } = {}) {
    const nextInside =
      new Set();
    let intent = null;

    for (
      const event of
      worldDocument?.events ?? []
    ) {
      if (
        event.activation !== 'on-enter' ||
        event.sourceAreaId !== currentAreaId
      ) {
        continue;
      }

      const point =
        eventPoint(
          currentAreaId,
          event
        );
      const inside =
        Boolean(
          point &&
          worldTriggerContainsPoint(
            entity,
            point
          )
        );

      if (inside) {
        nextInside.add(event.id);
      }

      if (
        !intent &&
        inside &&
        !insideOnEnter.has(event.id) &&
        eligible(
          event,
          consumedIds
        )
      ) {
        consumeIfNeeded(event);
        intent =
          freezeIntent(event);
      }
    }

    insideOnEnter =
      nextInside;

    return intent;
  }

  function peekInteractable({
    currentAreaId,
    entity
  } = {}) {
    for (
      const event of
      worldDocument?.events ?? []
    ) {
      if (
        event.activation !==
          'on-interact' ||
        event.sourceAreaId !==
          currentAreaId ||
        !eligible(
          event,
          consumedIds
        )
      ) {
        continue;
      }

      const point =
        eventPoint(
          currentAreaId,
          event
        );

      if (
        point &&
        worldTriggerContainsPoint(
          entity,
          point
        )
      ) {
        return freezeIntent(
          event
        );
      }
    }

    return null;
  }

  function interact(context = {}) {
    const intent =
      peekInteractable(context);

    if (!intent) return null;

    const event =
      (worldDocument?.events ?? [])
        .find(
          (entry) =>
            entry.id ===
            intent.eventId
        );

    if (!event) return null;

    consumeIfNeeded(event);
    return intent;
  }

  return Object.freeze({
    step,
    peekInteractable,
    interact,
    isConsumed(eventId) {
      return consumedIds.has(
        eventId
      );
    }
  });
}

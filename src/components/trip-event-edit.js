import {eventGroups, eventTypesWithPrepositions} from "../const.js";
import {formatDateToEventEdit} from "../utils/date/formatters.js";

const createEventsTypeMarkup = (eventTypes) => {
  return eventTypes.map((eventType) => {
    const lowercaseEventType = eventType.toLowerCase();

    return (
      `<div class="event__type-item">
        <input id="event-type-${lowercaseEventType}-1" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${lowercaseEventType}">
        <label class="event__type-label  event__type-label--${lowercaseEventType}" for="event-type-${lowercaseEventType}-1">${eventType}</label>
      </div>`
    );
  }).join(`\n`);
};

const createEventGroupsMarkup = (groups) => {
  const groupNames = Object.keys(groups);

  return groupNames.map((groupName) => {
    return (
      `<fieldset class="event__type-group">
        <legend class="visually-hidden">${groupName}</legend>
        ${createEventsTypeMarkup(groups[groupName])}
      </fieldset>`
    );
  }).join(`\n`);
};

const createDestinationsMarkup = (destinations) => {
  return destinations.map((destination) => {
    return (
      `<option value="${destination}"></option>`
    );
  }).join(`\n`);
};

const createOffersMarkup = (offers, checkedOffers) => {
  return offers.map((offer) => {
    const {id, title, price} = offer;
    const isChecked = checkedOffers.filter((checkedOffer) => checkedOffer.id === id).length > 0;

    return (
      `<div class="event__offer-selector">
        <input class="event__offer-checkbox  visually-hidden" id="event-offer-${id}-1" type="checkbox" name="event-offer-${id}" ${isChecked ? `checked` : ``}>
        <label class="event__offer-label" for="event-offer-${id}-1">
          <span class="event__offer-title">${title}</span>
          +
          €&nbsp;<span class="event__offer-price">${price}</span>
        </label>
      </div>`
    );
  }).join(`\n`);
};

const createPhotosMarkup = (photos) => {
  return photos.map((photo) => {
    return (
      `<img class="event__photo" src="${photo.src}" alt="${photo.description}"></img>`
    );
  }).join(`\n`);
};

export const createTripEventEditTemplate = (tripEvent) => {
  const {type, destination, destinations, start, end, basePrice, checkedOffers, offers, isFavourite} = tripEvent;

  const eventGroupsMarkup = createEventGroupsMarkup(eventGroups);
  const destinationsMarkup = createDestinationsMarkup(destinations);

  const isType = !!type;

  const isStartTime = !!start;
  const startTime = isStartTime ? formatDateToEventEdit(start) : ``;
  const isEndTime = !!start;
  const endTime = isEndTime ? formatDateToEventEdit(end) : ``;

  const description = destination.description;
  const photos = destination.photos;

  const isOffersType = checkedOffers.length > 0;
  const isInfo = !!description;

  const favourite = isFavourite ? `checked` : ``;

  return (
    `<form class="trip-events__item  event  event--edit" action="#" method="post">
      <header class="event__header">
        <div class="event__type-wrapper">
          <label class="event__type  event__type-btn" for="event-type-toggle-1">
            <span class="visually-hidden">Choose event type</span>
            <img class="event__type-icon" width="17" height="17" src="img/icons/${isType ? type.toLowerCase() : `taxi`}.png" alt="Event type icon">
          </label>
          <input class="event__type-toggle  visually-hidden" id="event-type-toggle-1" type="checkbox">

          <div class="event__type-list">
          ${eventGroupsMarkup}
          </div>
        </div>

        <div class="event__field-group  event__field-group--destination">
          <label class="event__label  event__type-output" for="event-destination-1">
          ${isType ? eventTypesWithPrepositions[type] : `Taxi to`}
          </label>
          <input class="event__input  event__input--destination" id="event-destination-1" type="text" name="event-destination" value="${destination.name}" list="destination-list-1">
          <datalist id="destination-list-1">
            ${destinationsMarkup}
          </datalist>
        </div>

        <div class="event__field-group  event__field-group--time">
          <label class="visually-hidden" for="event-start-time-1">
            From
          </label>
          <input class="event__input  event__input--time" id="event-start-time-1" type="text" name="event-start-time" value="${(startTime)}">
          &mdash;
          <label class="visually-hidden" for="event-end-time-1">
            To
          </label>
          <input class="event__input  event__input--time" id="event-end-time-1" type="text" name="event-end-time" value="${endTime}">
        </div>

        <div class="event__field-group  event__field-group--price">
          <label class="event__label" for="event-price-1">
            <span class="visually-hidden">Price</span>
            &euro;
          </label>
          <input class="event__input  event__input--price" id="event-price-1" type="text" name="event-price" value="${basePrice}">
        </div>

        <button class="event__save-btn  btn  btn--blue" type="submit">Save</button>
        <button class="event__reset-btn" type="reset">Cancel</button>

        <input id="event-favorite-1" class="event__favorite-checkbox  visually-hidden" type="checkbox" name="event-favorite" ${favourite}>
        <label class="event__favorite-btn" for="event-favorite-1">
          <span class="visually-hidden">Add to favorite</span>
          <svg class="event__favorite-icon" width="28" height="28" viewBox="0 0 28 28">
            <path d="M14 21l-8.22899 4.3262 1.57159-9.1631L.685209 9.67376 9.8855 8.33688 14 0l4.1145 8.33688 9.2003 1.33688-6.6574 6.48934 1.5716 9.1631L14 21z"/>
          </svg>
        </label>

        <button class="event__rollup-btn" type="button">
          <span class="visually-hidden">Open event</span>
        </button>
      </header>

      <section class="event__details">
    ${isOffersType ?
      `<section class="event__section  event__section--offers">
        <h3 class="event__section-title  event__section-title--offers">Offers</h3>

        <div class="event__available-offers">
          ${createOffersMarkup(offers, checkedOffers)}
        </div>
      </section>` : ``}

    ${isInfo ?
      `<section class="event__section  event__section--destination">
        <h3 class="event__section-title  event__section-title--destination">Destination</h3>
        <p class="event__destination-description">${description}</p>

        <div class="event__photos-container">
          <div class="event__photos-tape">
            ${createPhotosMarkup(photos)}
          </div>
        </div>
      </section>` : ``}

      </section>
    </form>`
  );
};
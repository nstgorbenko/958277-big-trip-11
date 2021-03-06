import DayComponent from "../components/day.js";
import EventsListComponent from "../components/events-list.js";
import SortComponent from "../components/sort.js";
import TripDaysComponent from "../components/trip-days.js";
import TripEventController from "./trip-event-controller.js";
import TripMessageComponent from "../components/trip-message.js";
import {formatDateToDayDatetime} from "../utils/date.js";
import {getSortedTripEvents} from "../utils/sort.js";
import {HIDDEN_CLASS} from "../const.js";
import {ActionType, Message, Mode, SortType} from "../const.js";
import {createNewEvent} from "../utils/common.js";
import {remove, render} from "../utils/dom.js";

const READY_MODE = `ready`;

const groupEventsByDays = (someEvents) => {
  return someEvents.reduce((days, currentDay) => {
    const someDate = formatDateToDayDatetime(currentDay.start);

    if (!days.hasOwnProperty(someDate)) {
      days[someDate] = [];
    }
    days[someDate].push(currentDay);

    return days;
  }, {});
};

export default class TripController {
  constructor(container, tripEventsModel, destinationsModel, offersModel, api, newEventComponent) {
    this._container = container;
    this._tripEventsModel = tripEventsModel;
    this._destinationsModel = destinationsModel;
    this._offersModel = offersModel;
    this._api = api;
    this._newEventComponent = newEventComponent;

    this._showedTripEvents = [];
    this._newEvent = null;
    this._tripMode = null;

    this._tripDaysComponent = new TripDaysComponent();
    this._tripMessageComponent = null;
    this._sortComponent = null;

    this._dispatch = this._dispatch.bind(this);
    this._sortTypeChangeHandler = this._sortTypeChangeHandler.bind(this);
    this._filterChangeHandler = this._filterChangeHandler.bind(this);
    this._serverSyncHandler = this._serverSyncHandler.bind(this);

    this._tripEventsModel.addFilterChangeHandler(this._filterChangeHandler);
    this._tripEventsModel.addServerSyncHandler(this._serverSyncHandler);
  }

  render() {
    this._tripMode = READY_MODE;
    const tripEvents = this._tripEventsModel.getAll();

    if (this._tripEventsModel.isEmpty()) {
      this._renderTripMessage(Message.NO_EVENTS);
      return;
    }

    this._renderFirstBoard(tripEvents);
  }

  createEvent() {
    if (this._newEvent !== null) {
      return;
    }

    if (this._tripEventsModel.isEmpty()) {
      this._removeTripMessage();
      this._renderNewEvent(this._container, Mode.FIRST);
    } else {
      this._setDefaultViews();
      this._renderNewEvent(this._tripDaysComponent.getElement(), Mode.ADD);
    }
  }

  hide() {
    this._container.classList.add(HIDDEN_CLASS);
  }

  show() {
    this._container.classList.remove(HIDDEN_CLASS);
  }

  showLoadingMessage() {
    this._renderTripMessage(Message.LOADING);
  }

  showErrorMessage() {
    this._renderTripMessage(Message.ERROR);
  }

  _renderFirstBoard(tripEvents) {
    this._removeTripMessage();

    this._sortComponent = new SortComponent();
    this._sortComponent.setChangeHandler(this._sortTypeChangeHandler);

    render(this._container, this._sortComponent);
    render(this._container, this._tripDaysComponent);

    const tripDays = this._tripDaysComponent.getElement();
    this._showedTripEvents = this._renderSortedTripEvents(SortType.DEFAULT, tripDays, tripEvents);
  }

  _renderNewEvent(container, mode) {
    this._newEvent = new TripEventController(container, this._destinationsModel, this._offersModel, this._dispatch);
    this._newEvent.render(createNewEvent(), mode);
  }

  _renderTripMessage(message) {
    this._removeTripMessage();
    this._tripMessageComponent = new TripMessageComponent(message);
    render(this._container, this._tripMessageComponent);
  }

  _removeTripMessage() {
    if (this._tripMessageComponent !== null) {
      remove(this._tripMessageComponent);
    }
  }

  _removeFirstBoard() {
    this._removeEvents();
    remove(this._sortComponent);
    remove(this._tripDaysComponent);
    this._renderTripMessage(Message.NO_EVENTS);
  }

  _removeNewEvent() {
    if (this._newEvent === null) {
      return;
    }
    this._newEvent.destroy();
    this._newEvent = null;
    this._newEventComponent.setDisabled(false);
  }

  _removeEvents() {
    this._showedTripEvents.forEach((tripEvent) => tripEvent.destroy());
    this._showedTripEvents = [];
  }

  _setDefaultViews() {
    this._showedTripEvents.forEach((tripEvent) => tripEvent.setDefaultView());
  }

  _updateEvents(sortType) {
    const tripDays = this._tripDaysComponent.getElement();
    const tripEvents = this._tripEventsModel.get();
    let newSortType = SortType.DEFAULT;
    if (this._newEvent === null) {
      newSortType = sortType || this._sortComponent.getActiveType();
    }

    this._removeEvents();
    this._tripDaysComponent.clear();
    this._showedTripEvents = this._renderSortedTripEvents(newSortType, tripDays, tripEvents);
  }

  _renderTripEvents(container, tripEvents) {
    return tripEvents.map((tripEvent) => {
      const tripEventController = new TripEventController(container, this._destinationsModel, this._offersModel, this._dispatch);
      tripEventController.render(tripEvent);

      return tripEventController;
    });
  }

  _renderGroupedEvents(container, groupedEvents) {
    const days = Object.keys(groupedEvents);
    const eventControllers = [];

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const dayCounter = i + 1;
      const dayComponent = new DayComponent(day, dayCounter);
      const eventsListComponent = new EventsListComponent();

      for (const tripEvent of groupedEvents[day]) {
        const tripEventController = new TripEventController(eventsListComponent.getElement(), this._destinationsModel, this._offersModel, this._dispatch);
        tripEventController.render(tripEvent);
        eventControllers.push(tripEventController);
      }

      render(dayComponent.getElement(), eventsListComponent);
      render(container, dayComponent);
    }

    return eventControllers;
  }

  _renderAllEvents(container, allEvents) {
    const eventsByDays = groupEventsByDays(allEvents);
    return this._renderGroupedEvents(container, eventsByDays);
  }

  _renderSortedTripEvents(sortType, container, tripEvents) {
    const sortedTripEvents = getSortedTripEvents(tripEvents, sortType);

    if (sortType === SortType.DEFAULT) {
      return this._renderAllEvents(container, sortedTripEvents);
    }

    const dayComponent = new DayComponent();
    const eventsListComponent = new EventsListComponent();

    render(container, dayComponent);
    render(dayComponent.getElement(), eventsListComponent);

    return this._renderTripEvents(eventsListComponent.getElement(), sortedTripEvents);
  }

  _handleAddToFavoriteAction({payload}) {
    this._api.updateTripEvent(payload.id, payload.newData)
      .then((tripEvent) => {
        const isSuccess = this._tripEventsModel.update(payload.id, tripEvent);
        if (isSuccess) {
          payload.controller.render(tripEvent, Mode.EDIT);
        }
      });
  }

  _handleDeleteAction({payload}) {
    this._api.deleteTripEvent(payload.id)
      .then(() => {
        const isSuccess = this._tripEventsModel.deleteEvent(payload.id);
        if (!isSuccess) {
          return;
        }
        if (this._tripEventsModel.isEmpty()) {
          this._removeFirstBoard();
          return;
        }
        this._updateEvents();
      })
      .catch(() => {
        payload.controller.shake();
      });
  }

  _handleRemoveNewEventAction() {
    this._removeNewEvent();

    if (this._tripEventsModel.isEmpty()) {
      this._renderTripMessage(Message.NO_EVENTS);
    }
  }

  _handleToEditAction() {
    this._setDefaultViews();
    if (this._newEvent !== null) {
      this._removeNewEvent();
    }
  }

  _handleUpdateAction({payload}) {
    this._api.updateTripEvent(payload.id, payload.newData)
      .then((tripEvent) => {
        const isSuccess = this._tripEventsModel.update(payload.id, tripEvent);
        if (isSuccess) {
          this._updateEvents();
        }
      })
      .catch(() => {
        payload.controller.shake();
      });
  }

  _handleAddNewEventAction({payload}) {
    this._api.createTripEvent(payload.newData)
      .then((tripEvent) => {
        this._tripEventsModel.add(tripEvent);
        this._removeNewEvent();

        const tripEvents = this._tripEventsModel.getAll();
        if (tripEvents.length === 1) {
          this._renderFirstBoard(tripEvents);
        } else {
          this._updateEvents();
        }
      })
      .catch(() => {
        payload.controller.shake();
      });
  }

  _dispatch(action) {
    switch (action.type) {
      case ActionType.ADD_TO_FAVORITE:
        this._handleAddToFavoriteAction(action);
        break;
      case ActionType.DELETE:
        this._handleDeleteAction(action);
        break;
      case ActionType.ADD_NEW_EVENT:
        this._handleAddNewEventAction(action);
        break;
      case ActionType.REMOVE_NEW_EVENT:
        this._handleRemoveNewEventAction();
        break;
      case ActionType.TO_EDIT:
        this._handleToEditAction();
        break;
      case ActionType.UPDATE:
        this._handleUpdateAction(action);
        break;
    }
  }

  _filterChangeHandler() {
    if (this._sortComponent !== null) {
      this._sortComponent.setDefault();
    }
    this._updateEvents();
  }

  _sortTypeChangeHandler(sortType) {
    this._updateEvents(sortType);
  }

  _serverSyncHandler() {
    if (this._tripMode !== null) {
      this._removeNewEvent();
      this._updateEvents();
    }
  }
}

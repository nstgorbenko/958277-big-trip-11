import {RenderPosition} from "../const.js";

export const createElement = (template) => {
  const newElement = document.createElement(`div`);
  newElement.innerHTML = template;

  return newElement.firstChild;
};

export const render = (container, component, place = RenderPosition.BEFOREEND) => {
  switch (place) {
    case RenderPosition.BEFOREBEGIN:
      container.before(component.getElement());
      break;
    case RenderPosition.AFTERBEGIN:
      container.prepend(component.getElement());
      break;
    case RenderPosition.BEFOREEND:
      container.append(component.getElement());
      break;
    case RenderPosition.AFTEREND:
      container.after(component.getElement());
      break;
    default:
      throw new Error(`Unknown render position: ${place}`);
  }
};

export const replace = (newComponent, oldComponent) => {
  oldComponent.getElement().replaceWith(newComponent.getElement());
};


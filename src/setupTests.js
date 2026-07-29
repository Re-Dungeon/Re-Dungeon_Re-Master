import '@testing-library/jest-dom';

// @xyflow/react (React Flow) reads element sizes via ResizeObserver, que o
// jsdom não implementa — sem este polyfill, qualquer teste que renderize o
// canvas do fluxograma da Campanha falha com "ResizeObserver is not defined".
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
}

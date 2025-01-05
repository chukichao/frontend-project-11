export default (state, elements) => (path, value) => {
  const [formRss, inputUrl, buttonSubmit] = elements;

  switch (value) {
    case 'expectation': {
      formRss.reset();
      inputUrl.focus();
      buttonSubmit.removeAttribute('disabled');
      break;
    }
    case 'loading': {
      buttonSubmit.setAttribute('disabled', '');
      inputUrl.classList.remove('is-invalid');
      break;
    }
    case 'incorrectly': {
      inputUrl.classList.add('is-invalid');
      break;
    }
    default:
      throw new Error(`Error: undefined state of the process '${state.processState}'`);
  }
};

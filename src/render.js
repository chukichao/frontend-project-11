export default (state, i18nextInstance, elements) => (path, value) => {
  const [formRss, inputUrl, buttonSubmit] = elements;

  const formFeedback = document.querySelector('.feedback');

  switch (value) {
    case 'processing': {
      buttonSubmit.setAttribute('disabled', '');
      break;
    }
    case 'expectation': {
      formRss.reset();
      inputUrl.focus();
      buttonSubmit.removeAttribute('disabled');
      break;
    }
    case 'erroneous process': {
      inputUrl.classList.add('is-invalid');
      formFeedback.textContent = i18nextInstance.t(`errors.${state.error}`);
      formFeedback.classList.replace('text-success', 'text-danger');
      buttonSubmit.removeAttribute('disabled');
      inputUrl.focus();
      break;
    }
    case 'successful process': {
      inputUrl.classList.remove('is-invalid');
      formFeedback.textContent = i18nextInstance.t('loading.success');
      formFeedback.classList.replace('text-danger', 'text-success');
      break;
    }
    default:
      throw new Error(`Error: undefined state of the process '${state.processState}'`);
  }
};

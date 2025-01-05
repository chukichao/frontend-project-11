import './styles.scss';
import 'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';
import { setLocale } from 'yup';
import i18next from 'i18next';

import resources from './locales/index.js';
import render from './render.js';

const i18nextInstance = i18next.createInstance(
  {
    lng: 'ru',
    debug: true,
    resources,
  },
  (err) => {
    if (err) {
      throw new Error('something went wrong loading', err);
    }
  },
);

const initialState = {
  error: null,
  feeds: [],
  processState: 'expectation',
};

const formRss = document.querySelector('.rss-form');
const inputUrl = document.querySelector('#url-input');
const buttonSubmit = formRss.querySelector('button[type="submit"]');

const watchedState = onChange(
  initialState,
  render(initialState, i18nextInstance, [formRss, inputUrl, buttonSubmit]),
);

formRss.addEventListener('submit', (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const inputValueUrl = formData.get('url').trim();

  setLocale({
    string: {
      url: 'notUrl',
      required: 'required',
    },
    mixed: {
      notOneOf: 'exists',
    },
  });

  const schemaUrl = yup.string().required().url().min(0)
    .notOneOf(initialState.feeds);

  schemaUrl
    .validate(inputValueUrl)
    .then(() => {
      watchedState.processState = 'processing';
      initialState.feeds = [...initialState.feeds, inputValueUrl];
      watchedState.processState = 'successful process';
      watchedState.processState = 'expectation';
    })
    .catch((err) => {
      watchedState.processState = 'processing';
      const error = err.errors.at(0);
      initialState.error = error;
      watchedState.processState = 'erroneous process';
      initialState.error = null;
    });
});

import './styles.scss';
import 'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';
import { setLocale } from 'yup';
import i18next from 'i18next';
import axios from 'axios';

import resources from './locales/index.js';
import render from './render.js';
import parcer from './parcer.js';

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
  loadedUrl: [],
  feeds: [],
  error: null,
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
    .notOneOf(initialState.loadedUrl);

  schemaUrl
    .validate(inputValueUrl)
    .then(async () => {
      watchedState.processState = 'processing';

      try {
        const response = await axios.get(
          `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(
            inputValueUrl,
          )}`,
        );
        const feed = parcer(response.data.contents);
        initialState.loadedUrl = [...initialState.loadedUrl, inputValueUrl];
        initialState.feeds = [...initialState.feeds, feed];

        watchedState.processState = 'successful process';
        watchedState.processState = 'expectation';
      } catch (err) {
        initialState.error = err.message === 'incorrect RSS' ? 'noRss' : 'network';
        watchedState.processState = 'erroneous process';
        initialState.error = null;
      }
    })
    .catch((err) => {
      watchedState.processState = 'processing';
      const error = err.errors.at(0);
      initialState.error = error;
      watchedState.processState = 'erroneous process';
      initialState.error = null;
    });
});

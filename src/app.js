import onChange from 'on-change';
import * as yup from 'yup';
import { setLocale } from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import { keyBy, uniqueId } from 'lodash';

import resources from './locales/index.js';
import render from './render.js';
import { parceXML, getProxyURL } from './utils/utils.js';

const STATUS = {
  loading: 'loading',
  success: 'success',
  failed: 'failed',
};

const ERROR = {
  exists: 'exists',
  required: 'required',
  notUrl: 'notUrl',
  noRss: 'noRss',
  network: 'network',
  unknown: 'unknown',
};

export default () => {
  const i18nextInstance = i18next.createInstance(
    {
      lng: 'ru',
      debug: false,
      resources,
    },
    (err) => {
      if (err) {
        throw new Error('i18next Error');
      }
    },
  );

  const initialState = {
    feeds: [],
    posts: [],
    form: {
      isValid: true,
      error: null,
    },
    loadingProcess: {
      status: 'initial',
      error: null,
    },
    uiState: {
      viewedPosts: new Set(),
    },
  };

  setLocale({
    string: {
      url: ERROR.notUrl,
      required: ERROR.required,
    },
    mixed: {
      notOneOf: ERROR.exists,
    },
  });

  const element = {
    formRss: document.querySelector('.rss-form'),
    inputUrl: document.querySelector('input[aria-label="url"]'),
    buttonAdd: document.querySelector('button[aria-label="add"]'),
    formFeedback: document.querySelector('.feedback'),
    feedsElement: document.querySelector('.feeds'),
    postsElement: document.querySelector('.posts'),
  };

  const watchedState = onChange(initialState, render(initialState, i18nextInstance, element));

  const runUpdatingPosts = () => {
    const promises = watchedState.feeds.map(({ url }) => axios.get(getProxyURL(url)));

    let updatedPosts = [];
    Promise.all(promises)
      .then((responses) => {
        updatedPosts = responses
          .flatMap((response) => {
            const { items: posts } = parceXML(response.data.contents);

            return [...posts, ...watchedState.posts].filter(
              (post) => Object.hasOwn(keyBy(watchedState.posts, 'title'), post.title) === false,
            );
          })
          .map((post) => ({ id: uniqueId(), ...post }));

        if (watchedState.feeds.length) {
          watchedState.posts = [...updatedPosts, ...watchedState.posts];
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setTimeout(() => runUpdatingPosts(), 5000);
      });
  };

  runUpdatingPosts();

  const loadData = (inputValueUrl) => axios.get(getProxyURL(inputValueUrl)).then((res) => {
    let { channel: feed, items: posts } = parceXML(res.data.contents);

    feed = {
      id: uniqueId(),
      url: inputValueUrl,
      ...feed,
    };

    posts = posts.map((post) => ({
      id: uniqueId(),
      ...post,
    }));

    watchedState.feeds = [feed, ...watchedState.feeds];
    watchedState.posts = [...posts, ...watchedState.posts];
  });

  element.formRss.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const inputValueUrl = formData.get('url').trim();

    watchedState.loadingProcess.status = STATUS.loading;

    if (watchedState.form.error) watchedState.form.error = null;
    if (watchedState.loadingProcess.error) watchedState.loadingProcess.error = null;

    const schemaURL = yup
      .string()
      .required()
      .url()
      .min(0)
      .notOneOf(watchedState.feeds.map((feed) => feed.url));

    schemaURL
      .validate(inputValueUrl)
      .then(() => {
        loadData(inputValueUrl)
          .then(() => {
            watchedState.loadingProcess.status = STATUS.success;

            watchedState.form.isValid = true;
          })
          .catch((err) => {
            if (err.message === 'Parsing Error') {
              watchedState.loadingProcess.error = ERROR.noRss;
            } else if (err.message === 'Network Error') {
              watchedState.loadingProcess.error = ERROR.network;
              console.log(err);
            } else {
              watchedState.loadingProcess.error = ERROR.unknown;
              console.log(err);
            }

            watchedState.form.isValid = true;
            watchedState.loadingProcess.status = STATUS.failed;
          });
      })
      .catch((err) => {
        const errorIndex = 0;
        const errorCode = err.errors.at(errorIndex);
        watchedState.form.error = errorCode;

        watchedState.form.isValid = false;
        watchedState.loadingProcess.status = STATUS.failed;
      });
  });
};

import onChange from 'on-change';
import * as yup from 'yup';
import { setLocale } from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import { keyBy } from 'lodash';

import resources from './locales/index.js';
import render from './render.js';
import parceXML from './utils/parcer.js';

const STATUS = {
  loading: 'loading',
  success: 'success',
  failed: 'failed',
  updating: 'updating',
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
      isValid: false,
      error: null,
    },
    loadingProcess: {
      status: '',
      error: null,
    },
    uiState: {
      viewedPosts: new Set(),
    },
  };

  const element = {
    formRss: document.querySelector('.rss-form'),
    inputUrl: document.querySelector('input[aria-label="url"]'),
    buttonAdd: document.querySelector('button[aria-label="add"]'),
    formFeedback: document.querySelector('.feedback'),
    feedsElement: document.querySelector('.feeds'),
    postsElement: document.querySelector('.posts'),
  };

  const watchedState = onChange(initialState, render(initialState, i18nextInstance, element));

  const loadData = async (inputValueUrl) => {
    await axios
      .get(
        `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(
          inputValueUrl,
        )}`,
      )
      .then((res) => {
        let { feed, posts } = parceXML(res.data.contents);

        feed = {
          id: Math.random() * 1e8,
          url: inputValueUrl,
          ...feed,
        };

        posts = posts.map((post) => ({
          id: Math.random() * 1e8,
          ...post,
        }));

        initialState.feeds = [feed, ...initialState.feeds];
        initialState.posts = [...initialState.posts, ...posts];
      });
  };

  const runUpdatingPosts = () => {
    const promises = initialState.feeds.map(({ url }) => axios.get(
      `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`,
    ));

    let updatedPosts = [];
    Promise.all(promises)
      .then((responses) => {
        responses.forEach((response) => {
          const { posts } = parceXML(response.data.contents);

          const filteredPosts = [...posts, ...initialState.posts].filter(
            (post) => Object.hasOwn(keyBy(initialState.posts, 'title'), post.title) === false,
          );

          updatedPosts = [...updatedPosts, ...filteredPosts];
        });
        updatedPosts = updatedPosts.map((post) => ({ id: Math.random() * 1e8, ...post }));
        initialState.posts = [...initialState.posts, ...updatedPosts];
      })
      .catch((err) => {
        console.error(err);
      });

    initialState.posts.sort((a, b) => Math.sign(b.createAt - a.createAt));

    watchedState.loadingProcess.status = STATUS.updating;
    initialState.loadingProcess.status = '';

    setTimeout(() => runUpdatingPosts(), 5000);
  };

  element.formRss.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const inputValueUrl = formData.get('url').trim();

    watchedState.loadingProcess.status = STATUS.loading;

    setLocale({
      string: {
        url: ERROR.notUrl,
        required: ERROR.required,
      },
      mixed: {
        notOneOf: ERROR.exists,
      },
    });

    const schemaURL = yup
      .string()
      .required()
      .url()
      .min(0)
      .notOneOf(initialState.feeds.map((feed) => feed.url));

    schemaURL
      .validate(inputValueUrl)
      .then(async () => {
        try {
          await loadData(inputValueUrl);

          watchedState.loadingProcess.status = STATUS.success;

          if (initialState.feeds.length === 1) {
            runUpdatingPosts();
          }
        } catch (err) {
          if (err.message === 'RSS Error') {
            initialState.loadingProcess.error = ERROR.noRss;
          } else if (err.message === 'Network Error') {
            initialState.loadingProcess.error = ERROR.network;
            console.log(err);
          } else {
            initialState.loadingProcess.error = ERROR.unknown;
            console.log(err);
          }

          initialState.form.isValid = true;

          watchedState.loadingProcess.status = STATUS.failed;
          initialState.loadingProcess.error = null;
        }
      })
      .catch((err) => {
        const errorIndex = 0;
        const errorCode = err.errors.at(errorIndex);
        initialState.form.error = errorCode;

        initialState.form.isValid = false;

        watchedState.loadingProcess.status = STATUS.failed;
        initialState.form.error = null;
      });
  });
};

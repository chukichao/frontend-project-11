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

const getParsedData = (data) => {
  const doc = parceXML(data);

  const getDateByTitlePost = (title) => new Date(title.split(' ').at(-1)).getTime();

  const feed = {
    title: doc.querySelector('channel > title').textContent,
    description: doc.querySelector('channel > description').textContent,
  };

  const posts = Array.from(doc.querySelectorAll('item')).map((post) => {
    const title = post.querySelector('title').textContent;
    const description = post.querySelector('description').textContent;
    const createAt = getDateByTitlePost(title);

    return {
      title,
      description,
      createAt,
    };
  });

  return { feed, posts };
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
      status: '',
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
    const promises = initialState.feeds.map(({ url }) => axios.get(getProxyURL(url)));

    let updatedPosts = [];
    Promise.all(promises)
      .then((responses) => {
        responses.forEach((response) => {
          const { posts } = getParsedData(response.data.contents);

          const filteredPosts = [...posts, ...initialState.posts].filter(
            (post) => Object.hasOwn(keyBy(initialState.posts, 'title'), post.title) === false,
          );

          updatedPosts = [...updatedPosts, ...filteredPosts];
        });
        updatedPosts = updatedPosts.map((post) => ({ id: uniqueId(), ...post }));

        watchedState.posts = [...initialState.posts, ...updatedPosts];

        watchedState.posts.sort((a, b) => Math.sign(b.createAt - a.createAt));
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setTimeout(() => runUpdatingPosts(), 5000);
      });
  };

  if (initialState.posts.length > 0) {
    runUpdatingPosts();
  }

  const loadData = (inputValueUrl) => axios.get(getProxyURL(inputValueUrl)).then((res) => {
    let { feed, posts } = getParsedData(res.data.contents);

    feed = {
      id: uniqueId(),
      url: inputValueUrl,
      ...feed,
    };

    posts = posts.map((post) => ({
      id: uniqueId(),
      ...post,
    }));

    if (initialState.posts.length === 0) {
      runUpdatingPosts();
    }

    watchedState.feeds = [feed, ...initialState.feeds];
    watchedState.posts = [...initialState.posts, ...posts];
  });

  element.formRss.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const inputValueUrl = formData.get('url').trim();

    watchedState.loadingProcess.status = STATUS.loading;

    const schemaURL = yup
      .string()
      .required()
      .url()
      .min(0)
      .notOneOf(initialState.feeds.map((feed) => feed.url));

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
              initialState.loadingProcess.error = ERROR.noRss;
            } else if (err.message === 'Network Error') {
              initialState.loadingProcess.error = ERROR.network;
              console.log(err);
            } else {
              initialState.loadingProcess.error = ERROR.unknown;
              console.log(err);
            }

            watchedState.form.isValid = true;

            watchedState.loadingProcess.status = STATUS.failed;
            initialState.loadingProcess.error = null;
          });
      })
      .catch((err) => {
        const errorIndex = 0;
        const errorCode = err.errors.at(errorIndex);
        initialState.form.error = errorCode;

        watchedState.form.isValid = false;

        watchedState.loadingProcess.status = STATUS.failed;
        initialState.form.error = null;
      });
  });
};

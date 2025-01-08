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
    debug: false,
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
  error: '',
  processState: '',
};

const formRss = document.querySelector('.rss-form');
const inputUrl = document.querySelector('#url-input');
const buttonSubmit = formRss.querySelector('button[type="submit"]');

const watchedState = onChange(
  initialState,
  render(initialState, i18nextInstance, [formRss, inputUrl, buttonSubmit]),
);

const updatingPosts = () => {
  setTimeout(() => {
    if (initialState.loadedUrl.length > 0) {
      initialState.loadedUrl.forEach(async (url) => {
        try {
          const response = await axios.get(
            `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`,
          );
          const { posts } = parcer(response.data.contents, url);
          const foundFeed = initialState.feeds.find((feed) => feed.url === url);

          for (let i = 0; i < posts.length; i += 1) {
            if (posts[i].date !== foundFeed.posts[i].date) {
              const lastUpdatePost = posts[i];
              foundFeed.posts.unshift(lastUpdatePost);
            } else {
              break;
            }
          }

          foundFeed.posts.sort((a, b) => Math.sign(b.date - a.date));

          watchedState.processState = 'updating posts';
          initialState.processState = '';
          updatingPosts();
        } catch (err) {
          if (err.message === 'Network Error') {
            console.error(err);
          }
          updatingPosts();
        }
      });
    }
  }, 5000);
};

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
      watchedState.processState = 'loading posts';

      try {
        const response = await axios.get(
          `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(
            inputValueUrl,
          )}`,
        );
        const feed = parcer(response.data.contents, inputValueUrl);
        initialState.feeds = [...initialState.feeds, feed];
        initialState.loadedUrl = [...initialState.loadedUrl, inputValueUrl];

        watchedState.processState = 'successful loaded';
        watchedState.processState = 'clearing field';
        updatingPosts();
      } catch (err) {
        initialState.error = err.message === 'RSS Error' ? 'noRss' : 'network';
        if (initialState.error === 'network') {
          console.log(err);
        }
        watchedState.processState = 'erroneous loaded';
      }
    })
    .catch((err) => {
      watchedState.processState = 'loading posts';
      const error = err.errors.at(0);
      initialState.error = error;
      watchedState.processState = 'erroneous loaded';
    });
});

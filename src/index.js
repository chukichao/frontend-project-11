import onChange from 'on-change';
import * as yup from 'yup';
import './styles.scss';
import 'bootstrap';

import render from './render.js';

const initialState = {
  feeds: [],
  processState: 'expectation',
};

const formRss = document.querySelector('.rss-form');
const inputUrl = document.querySelector('#url-input');
const buttonSubmit = formRss.querySelector('button[type="submit"]');

const watchedState = onChange(
  initialState,
  render(initialState, [formRss, inputUrl, buttonSubmit]),
);

formRss.addEventListener('submit', (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const inputValueUrl = formData.get('url');

  const schemaRss = yup.string().required().url().min(0);

  if (initialState.feeds.find((feed) => feed.url === inputValueUrl)) {
    watchedState.processState = 'incorrectly';
    return;
  }

  schemaRss
    .validate(inputValueUrl)
    .then(() => {
      watchedState.processState = 'loading';
      const feed = {
        url: inputValueUrl,
      };
      initialState.feeds = [...initialState.feeds, feed];
      watchedState.processState = 'expectation';
    })
    .catch(() => {
      watchedState.processState = 'incorrectly';
    });
});

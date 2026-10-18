import './static/styles/_variables.scss'
import './static/styles/main.scss'

import { mount } from 'svelte'
import App from './App.svelte'

mount(App, { target: document.getElementById('app-root')! })


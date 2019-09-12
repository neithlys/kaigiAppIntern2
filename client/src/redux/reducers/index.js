import { combineReducers } from 'redux'
import filterReducer from './filterReducer'
import languageReducer from './languageReducer'

export default combineReducers({
    filterReducer,
    languageReducer,
})

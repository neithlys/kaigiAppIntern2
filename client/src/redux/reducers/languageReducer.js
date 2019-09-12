import * as types from '../actions/types'

const initialState = {
    language: 'en',
    email: '',
    pass: '',
}

const languageReducer = (state = initialState, action) => {
    switch (action.type) {
        case types.CHANGE_LANGUAGE: {
            return {
                ...state,
                language: action.language,
            }
        }
        case types.REMEMBER_ACC: {
            return {
                ...state,
                email: action.email,
                pass: action.pass,
                check: action.check,
            }
        }
        default:
            return state
    }
}

export default languageReducer

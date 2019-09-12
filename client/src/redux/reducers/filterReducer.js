import { FILTER, GET_LIST } from '../actions/types'

const initialState = {
    data: [],
}

export default function(state = initialState, action) {
    switch (action.type) {
        case GET_LIST:
            // console.log(action.data)
            return {
                ...state,
                data: action.data,
            }
        case FILTER:
            return {
                ...state,
                data: action.dataFilter,
            }
        default:
            return state
    }
}

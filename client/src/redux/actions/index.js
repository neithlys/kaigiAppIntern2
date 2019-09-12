import { FILTER, GET_LIST, CHANGE_LANGUAGE, REMEMBER_ACC } from './types'

export const filterFacility = (data) => ({
    type: FILTER,
    dataFilter: data,
})

export const changeLanguage = (language) => {
    return {
        type: CHANGE_LANGUAGE,
        language,
    }
}

export const rememberAcc = (email, pass, check) => ({
    type: REMEMBER_ACC,
    email,
    pass,
    check,
})

export const getList = (data) => ({
    type: GET_LIST,
    data,
})

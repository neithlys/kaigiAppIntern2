import { connect } from 'react-redux'
import React from 'react'
import { Text } from 'react-native'
import I18n from '../i18n/i18n'

class CustomText extends React.Component {
    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.language !== prevState.language) {
            return { language: nextProps.language }
        }
        return null
    }

    constructor(props) {
        super(props)
        this.state = {
            i18n: I18n,
            language: '',
        }
    }

    // componentWillMount() {
    //     const { language } = this.props
    //     if (language) this.setMainLocaleLanguage(language)
    // }
    componentDidMount() {
        const { language } = this.props
        if (language) this.setMainLocaleLanguage(language)
    }

    componentDidUpdate(prevProps, prevState) {
        const { language } = this.state
        if (prevState.language !== language) {
            this.setMainLocaleLanguage(language)
        }
    }

    setMainLocaleLanguage(language) {
        const { i18n } = this.state
        i18n.locale = language
        this.setState({ i18n })
    }

    render() {
        const { i18nKey, children } = this.props
        const { i18n } = this.state
        return <Text>{i18nKey ? i18n.t(i18nKey) : children}</Text>
    }
}

const mapStateToProps = (state) => {
    return {
        language: state.languageReducer.language,
    }
}

export default connect(
    mapStateToProps,
    null
)(CustomText)

import React, { Component } from 'react'
import { Platform, StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen'
import Modal from 'react-native-modal'

const styles = StyleSheet.create({
    MainContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Platform.OS == 'ios' ? 20 : 0,
    },

    titleView: {
        width: '100%',
        height: '25%',
        backgroundColor: '#f5f5f5',
        padding: 20,
        alignItems: 'center',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },

    title: {
        fontSize: 30,
        color: 'black',
        fontWeight: 'bold',
    },

    contentView: {
        width: '100%',
        padding: 10,
        backgroundColor: 'white',
    },

    content: {
        fontSize: 20,
        textAlign: 'justify',
    },
    btnView: {
        width: '100%',
        height: '20%',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        alignItems: 'center',
        backgroundColor: 'white',
        justifyContent: 'center',
    },

    buttonStyle: {
        width: '60%',
        height: '65%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#54baa2',
        borderRadius: 7,
        margin: 5,
    },

    TextStyle: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 30,
        marginTop: -5,
    },
})

const Notify = (props) => {
    const { titleNotify, contentNotify, btnContent } = props
    return (
        <View style={styles.MainContainer}>
            <NotifyContent title={titleNotify} content={contentNotify} contentBtn={btnContent} />
        </View>
    )
}

class NotifyContent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isVisible: false,
        }
    }

    _toggleModal() {
        const { isVisible } = this.state
        this.setState({ isVisible: !isVisible })
    }

    render() {
        const { isVisible } = this.state
        const { title, content, contentBtn } = this.props
        return (
            <View style={styles.MainContainer}>
                <TouchableOpacity
                    style={{
                        backgroundColor: 'blue',
                        width: '20%',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    onPress={this._toggleModal}
                >
                    <Text style={{ fontSize: 20, color: 'white' }}>ClickMe</Text>
                </TouchableOpacity>
                <Modal
                    isVisible={isVisible}
                    style={{ justifyContent: 'center', alignItems: 'center' }}
                    animationIn="swing"
                    animationOut="tada"
                >
                    <View
                        style={{
                            width: '80%',
                            alignItems: 'center',
                            borderRadius: 20,
                            height: '40%',
                        }}
                    >
                        <View style={styles.titleView}>
                            <Text style={styles.title}>{title}</Text>
                        </View>
                        <View style={styles.contentView}>
                            <Text style={styles.content}>{content}</Text>
                        </View>
                        <View style={styles.btnView}>
                            <TouchableOpacity style={styles.buttonStyle} onPress={this._toggleModal}>
                                <Text style={styles.TextStyle}>{contentBtn}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        )
    }
}

export default Notify

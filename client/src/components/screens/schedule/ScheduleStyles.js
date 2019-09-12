import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'
import { StyleSheet } from 'react-native'
const scheduleStyles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    subContainer1: {
        flex: 0.5,
    },
    subContainer2: {
        flex: 0.5,
    },
    input: {
        height: 60,
        paddingBottom: 10,
        fontSize: 20,
        borderWidth: 0,
        borderBottomWidth: 1.5,
        borderBottomColor: 'black',
    },
    btnSubmit: {
        height: hp('5%'),
        marginTop: 20,
        width: wp('90%'),
        padding: 10,
        backgroundColor: '#1175b5',
    },
    labelInput: {
        color: 'black',
    },
    formInput: {
        marginBottom: 20,
        width: wp('90%'),
        borderColor: 'black',
    },
    btnContent: {
        color: 'white',
        fontSize: hp('3%'),
        fontWeight: 'bold',
        justifyContent: 'center',
    },
    checkbox: {
        backgroundColor: 'white',
        borderWidth: 0,
    },
})
export default scheduleStyles

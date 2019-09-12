import React from 'react'
import { View, FlatList, TouchableOpacity } from 'react-native'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'
import { TriangleColorPicker, toHsv, fromHsv } from 'react-native-color-picker'

export default class ColorPick extends React.Component {
    constructor(props) {
        super(props)
        this.onColorChanged = this.onColorChanged.bind(this)

        this.state = {
            color: toHsv(this.props.initColor || 'green'),
            //   arrColor:
            //   ['red',
            //   'blue',
            //   'green',
            //   'yellow',
            //   'orange',
            //   'grey',
            //   'purple',
            //   'black'
            // ]
        }
    }

    onColorChanged = (color) => {
        this.setState({ color })
    }

    getColor = () => {
        return fromHsv(this.state.color)
    }

    render() {
        return (
            <TriangleColorPicker
                //   oldColor='purple'
                color={this.state.color}
                onColorChange={this.onColorChanged}
                onColorSelected={(color) => alert(`Color selected: ${color}`)}
                onOldColorSelected={(color) => alert(`Old color selected: ${color}`)}
                style={{ flex: 1 }}
                hideSliders
            />
            // <View>
            //     <FlatList
            //       data={this.state.arrColor}
            //       renderItem={({ item }) => {
            //       return (
            //         <TouchableOpacity style={{
            //           height: wp('10%'), width: wp('10%'), borderRadius: 100, backgroundColor: item, margin: 2
            //         }} onPress={() => this.onColorChanged(item)}/>
            //       )}}
            //       keyExtractor={item => item}
            //       // refreshing={this.state.isLoading}
            //       // refreshControl={
            //       //   <RefreshControl
            //       //     refreshing={this.state.isLoading}
            //       //     onRefresh={this._onRefresh}
            //       //   />
            //       // }
            //       numColumns={4}
            //     >

            //     </FlatList>
            //     <View style={{
            //       backgroundColor: this.state.color, width: wp('40%'), height: hp('5%'), margin: 10
            //     }} />
            // </View>
        )
    }
}

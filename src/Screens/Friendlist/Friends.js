import React, {Component} from 'react';
import {
  View,
  Text,
  Image,
  ToastAndroid,
  Platform,
  PermissionsAndroid,
  Dimensions,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import MapView, {Marker , PROVIDER_GOOGLE} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import styles from '../constant/styles';
import database from '@react-native-firebase/database';
import SafeAreaView from 'react-native-safe-area-view';
import Carousel from 'react-native-snap-carousel';

const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default class HomeScreen extends Component {
  // static navigationOptions = {
  //   header: null,
  // };

  state = {
    initial: 'state',
    mapRegion: null,
    latitude: 0,
    longitude: 0,
    userList: [],
    uid: null,
  };

  componentDidMount = async () => {
    await this.getDataUser();
    await this.getLocation();
    // const uid = await AsyncStorage.getItem('userid');
  };

  async getDataUser(uid) {
    this.setState({uid: uid, refreshing: true});
    await database().ref('/users').on('child_added', data => {
      let person = data.val();
      console.log('ui',person)
      if (person.id !== uid) {
        this.setState(prevData => {
          return {userList: [...prevData.userList, person]};
        console.log(prevData)
        });

        this.setState({
          refreshing: false,
          isLoading: false,
        });
      }
    });
  }

  hasLocationPermission = async () => {
    if (
      Platform.OS === 'ios' ||
      (Platform.OS === 'android' && Platform.Version < 23)
    ) {
      return true;
    }
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (hasPermission) {
      return true;
    }
    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (status === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }
    if (status === PermissionsAndroid.RESULTS.DENIED) {
      ToastAndroid.show(
        'Location Permission Denied By User.',
        ToastAndroid.LONG,
      );
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      ToastAndroid.show(
        'Location Permission Revoked By User.',
        ToastAndroid.LONG,
      );
    }
    return false;
  };

  getLocation = async () => {
    const hasLocationPermission = await this.hasLocationPermission();

    if (!hasLocationPermission) {
      return;
    }

    this.setState({loading: true}, () => {
      Geolocation.getCurrentPosition(
        position => {
          let region = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.00922,
            longitudeDelta: 0.00421 * 1.5,
          };
          this.setState({
            mapRegion: region,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            loading: false,
          });
          // console.warn(position);
        },
        error => {
          this.setState({errorMessage: error});
          // console.warn(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          distanceFilter: 50,
          forceRequestLocation: true,
        },
      );
    });
  };

  onCorouselItemChange = (index) =>{
    let location = this.state.userList[index]
    this._map.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.00922,
      longitudeDelta: 0.00421 * 1.5,
    })
  }
  _renderItem = ({item}) => 
 
        <View style={styless.card}>
            <Text style={styless.name}>{ item.name }</Text>
            <Image
                      source={{uri: item.photo}}
                      style={styless.imgcard}
                    /> 
        </View>


  render() {
    // console.warn(this.state.userList);
    return (
      <SafeAreaView style={{flex: 1}}>
        {/* <Header /> */}
        <View
          style={[
            styles.container,
            {
              justifyContent: 'flex-start',
              paddingHorizontal: 10,
              paddingTop: 10,
            },
          ]}>
          <MapView
            style={{width: '100%', height: '90%'}}
            showsMyLocationButton={true}
            provider={PROVIDER_GOOGLE}
            ref={map => this._map = map}
            showsIndoorLevelPicker={true}
            showsUserLocation={true}
            zoomControlEnabled={true}
            showsCompass={true}
            showsTraffic={true}
            region={this.state.mapRegion}
            initialRegion={{
              latitude: -7.755322,
              longitude: 110.381174,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            }}>
            {this.state.userList.map(item => {
              // console.warn(item);
              return (
                <Marker
                  key={item.id}
                  title={item.name}
                  description={item.status}
                  draggable
                  coordinate={{
                    latitude: item.latitude || 0,
                    longitude: item.longitude || 0,
                  }}
                  onCalloutPress={() => {
                    this.props.navigation.navigate('FriendProfile', {
                      item,
                    });
                  }}>
                  <View>
                    <Image
                      source={{uri: item.photo}}
                      style={{width: 40, height: 40, borderRadius: 50}}
                    />
                    <Text>{item.name}</Text>
                  </View>
                </Marker>
              );
            })}
          </MapView>
          {/* <View style={styles.menuBottom}>
            <TouchableOpacity>
              <Text
                style={styles.buttonText}
                onPress={() => this.getLocation()}>
                Get Current Location
              </Text>
            </TouchableOpacity>
          </View> */}
          <Carousel
              ref={(c) => { this._carousel = c; }}
              data={this.state.userList}
              renderItem={this._renderItem}
              containerCustomStyle={styless.corousel}
              sliderWidth={Dimensions.get('window').width}
              itemWidth={240}
              style={{flex : 1}}
              onSnapToItem={(index)=> this.onCorouselItemChange(index)}
            />
        </View>
      </SafeAreaView>
    );
  }
}
const styless = StyleSheet.create({
  corousel : {
    position : 'absolute',
    bottom : 0
  },
  card : {
    backgroundColor : '#30A5E7',
    height : 170,
    width : 240,
    padding : 18,
    borderRadius : 15
  },
  imgcard : {
    height : 120,
    width : 240,
    bottom : 0,
    position : 'absolute',
    borderBottomLeftRadius : 15,
    borderBottomRightRadius : 15,
  },
  name : {
    color : 'white',
    fontSize : 18,
    alignSelf : 'center'
  }
})
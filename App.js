/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */
import RNFS from 'react-native-fs';
import uuid from './uuid';
import React, { Component } from 'react';
import { Alert, Slider, Platform, TextInput, StyleSheet, NativeModules, NativeEventEmitter, NativeAppEventEmitter, TouchableHighlight, Text, View } from 'react-native';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' + 'Shake or press menu button for dev menu'
});

async function requestRecordPermission() {
  try {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
      title: 'Native Recorder Permission',
      message: 'Native Recorder requires record permission.'
    });
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Got Record Permission');
    } else {
      console.log('Denied Record Permission');
    }
  } catch (err) {
    console.warn(err);
  }
}

async function requestStoragePermission() {
  try {
    const read_granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, {
      title: 'Native Recorder Permission',
      message: 'Native Recorder requires storage permission.'
    });
    if (read_granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Got Read Storage Permission');
    } else {
      console.log('Denied Read Storage Permission');
    }

    const write_granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, {
      title: 'Native Recorder Permission',
      message: 'Native Recorder requires storage permission.'
    });
    if (write_granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Got Write Storage Permission');
    } else {
      console.log('Denied Write Storage Permission');
    }
  } catch (err) {
    console.warn(err);
  }
}
if (Platform.OS === 'android') {
  requestRecordPermission();
  requestStoragePermission();
}

type Props = {};
const AudioEngine = NativeModules.AudioEngine;

//const AudioEventEmitter = new NativeEventEmitter(AudioEngine);

export default class App extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      filename: uuid() + '.wav',
      recording: false,
      currentTime: 0.0,
      position: 0,
      duration: 0,
      currentState: 'STATE_IDLE',
      manualPosition: '0', // string
    };
    AudioEngine.setInputGain(3);
    this.positionChange = null;
    this.stateChange = null;

    if (Platform.OS === 'android') {
      this.positionChange = NativeAppEventEmitter.addListener('audioPositionChanged', ev => {
        //console.log('audioPositionChanged: ' + ev.position + ' Duration: ' + ev.duration);
        this.updatePosition(ev.position, ev.duration);
      });
      this.stateChange = NativeAppEventEmitter.addListener('audioStateChanged', ev => {
        console.log(`audioStateChanged: ${ev.state}`);
        this.updateState(ev.state);
      });
    } else {
      const AudioEventEmitter = new NativeEventEmitter(AudioEngine);
      this.positionChange = AudioEventEmitter.addListener('audioPositionChanged', ev => {
        console.log('ios audioPositionChanged: ' + ev.position + ' Duration: ' + ev.duration);
        this.updatePosition(ev.position, ev.duration);
      });
      this.stateChange = AudioEventEmitter.addListener('audioStateChanged', ev => {
        console.log('audioStateChanged: ' + ev.state);
        this.updateState(ev.state);
      });
    }
    AudioEngine.open(RNFS.DocumentDirectoryPath + '/' + this.state.filename)
      .then(result => console.log('AudioEngine::open ' + result))
      .catch(error => console.warn('AudioEngine::open error ' + error));
  }

  componentWillUnmount() {
    console.log('RECORDER', 'componentWillUnmount', this.positionChange);
    if (Platform.OS === 'android') {
      if (this.positionChange) NativeAppEventEmitter.removeListener(this.positionChange);
      if (this.stateChange) NativeAppEventEmitter.removeListener(this.stateChange);
    }
    if (this.positionChange) this.positionChange.remove();
    if (this.stateChange) this.stateChange.remove();

    //if (this._positionTimeout) clearTimeout(this._positionTimeout);

    AudioEngine.close();
    //AudioEngine = null;
  }

  updatePosition(position, duration) {
    console.log('updatePosition ' + position + ' Duration: ' + duration);
    this.setState({ currentTime: Math.floor(position), position, duration });
  }
  updateState(state) {
    console.log('updating state to ' + state);
    this.setState({ currentState: state });
  }
  seek = (p) => {
    console.log('seeking% = ' + p);
    AudioEngine.setPosition(p);
    this.setState({ currentTime: p });
  };
  handleGetPosition = () => {
    console.log('Get Position pressed');
    Promise.all([AudioEngine.position(), AudioEngine.duration()])
      .then((pos, dur) => {
        console.log('Get Position results: ' + pos + ', ' + dur);
      })
      .catch((err) => {
        console.error(err);
      });
  };
  handleSetPosition = () => {
    console.log('Set Position pressed', this.state.manualPosition);
    const pos = parseFloat(this.state.manualPosition);
    if (isNaN(pos) || pos > this.state.duration) {
      Alert.alert('Invalid position');
      return;
    }
    this.setState({ position: pos }, () => {
      AudioEngine.setPosition(this.state.position);
    });
  };
  changeManualPosition = (pos) => {
    this.setState({ manualPosition: pos })
  };
  handleRecord = () => {
    console.log('Record pressed');
    AudioEngine.record().then(() => { console.log('Recording started')});
  };
  handlePlay = () => {
    console.log('Play pressed');
    AudioEngine.play().then(() => { console.log('Playing started')});
  };
  handleStop = () => {
    console.log('Stop pressed');
    AudioEngine.stop();
  };

  render() {
    const currentState = this.state.currentState;
    return (
      <View style={styles.container}>
        <View style={[styles.row, { flexDirection: 'column', width: '75%', alignItems: 'flex-start' }]}>
          <Text>State: {this.state.currentState}</Text>
            <Text>Position: {this.state.position}</Text>
          <Text>Duration: {this.state.duration}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.buttons}>
            <TouchableHighlight
              title='Play'
              style={styles.button}
              onPress={this.handlePlay}
              disabled={this.state.duration === 0 || currentState !== 'STATE_IDLE'}
            >
              <Text style={styles.buttonText}>Play</Text>
            </TouchableHighlight>
            <TouchableHighlight
              title='Stop'
              style={styles.button}
              onPress={this.handleStop}
              disabled={currentState === 'STATE_IDLE'}
            >
              <Text style={styles.buttonText}>Stop!</Text>
            </TouchableHighlight>
            <TouchableHighlight
              title='Record'
              style={[styles.button, { backgroundColor: 'red' }]}
              onPress={this.handleRecord}
              disabled={currentState !== 'STATE_IDLE'}
            >
              <Text style={styles.buttonText}>Record</Text>
            </TouchableHighlight>
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'stretch' }}>
            <Slider
              onSlidingComplete={this.seek}
              value={this.state.currentTime}
              minimumValue={0}
              maximumValue={100}
              step={1}
              style={styles.slider}
              disabled={this.state.duration === 0 || currentState !== 'STATE_IDLE'}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.progressText}>{this.state.currentTime}s</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.buttons}>
            <TouchableHighlight
              title='Get Position'
              style={styles.button}
              onPress={this.handleGetPosition}
              disabled={currentState !== 'STATE_IDLE'}
            >
              <Text style={styles.buttonText}>Get Position</Text>
            </TouchableHighlight>
            <TextInput
              autoCorrect={false}
              autoCapitalize='none'
              onChangeText={this.changeManualPosition}
              value={this.state.manualPosition}
              style={{ borderColor: 'gray', borderWidth: 1, width: 50, height: '90%' }}
            />
            <TouchableHighlight
              title='Set Position'
              style={[ styles.button, { backgroundColor: 'green' }]}
              onPress={this.handleSetPosition}
              disabled={this.state.duration === 0 || currentState !== 'STATE_IDLE'}
            >
              <Text style={styles.buttonText}>Set Position</Text>
            </TouchableHighlight>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginTop: 50,
  },
  row: {
    padding: 10,
    minHeight: 60,
  },
  controls: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column'
  },
  buttons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    flex: 1,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 5,
    backgroundColor: '#87CEFA',
    borderColor: 'gray',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  progressText: {
    fontSize: 50
  },
  slider: {
    width: '90%'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5
  }
});

History
=======

## 0.9.1

* 'test/topic' is different from '/test/topic'
* Resetting ping timer on publish, subcribe, unsubscribe:
  [#47](https://github.com/mcollina/mosca/pull/47).

## 0.9.0

* Bumped Ascoltatori to 0.11.0.
* Improved logging for each client.
* Fixed multiple topic naming, mainly 'test/topic' and 'test/topic/'
  should be the same
  [#46](https://github.com/mcollina/mosca/pull/46).
* Better handling of defaults 
  [#39](https://github.com/mcollina/mosca/pull/39).
* Enforcing client identifier length
  [#33](https://github.com/mcollina/mosca/pull/33).

## 0.8.2

* Passing the correct Client object to `authorizePublish`,
  [#43](https://github.com/mcollina/mosca/pull/43).

## 0.8.1

* Refactored the Server-Persistence wiring interface
  to solve some spurious test failures.

## 0.8.0

* Updated Ascoltatori to 0.8.0.

## 0.7.3

* Fixed MongoDB persistance tests on Travis.
* Fixed spurious errors in Redis persistance.

## 0.7.2

* More README fixes.

## 0.7.1

* Typo fix, from persistance to persistence.

## 0.7.0

* Added persistance support
  [#36](https://github.com/mcollina/mosca/pull/36).
* Updated Ascoltatori to 0.7.0.

## 0.6.0

* Extracted a MoscaClient.

## 0.5.0

* Bunyan support for logging.
* Updated minimum MQTT.js version to 0.2.10.

## 0.4.3

* Passing the MQTT packet details to Ascoltatori
  [#30](https://github.com/mcollina/mosca/pull/30) by
  [@davedoesdev](https://github.com/davedoesdev).

## 0.4.2

* Not passing the options to subscribe anymore
  [@davedoesdev](https://github.com/davedoesdev).
* Updated Ascoltatori to 0.6.0.

## 0.4.1

* Fixed the NPM script.

## 0.4.0

* Pass the QoS level to the parent MQTT server
  (https://github.com/mcollina/mosca/pull/26), thanks to
  [@davedoesdev](https://github.com/davedoesdev).

## 0.3.0

* Node v0.10 support
* User authentication and authorization.

## 0.2.0

* QoS 1 (without storage) support
* Will messages support

## 0.1.1

* Bug fixes

## 0.1.0

* Initial release


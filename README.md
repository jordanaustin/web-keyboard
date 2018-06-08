# web-keyboard
A pure web based virtual keyboard with

⚠️ This is a work in progress. There are a lot of intricacies involved with creating a virtual keyboard in javascript. This project relies on some newer Web APIs. For example, `css grid` and `inputmode`.

Additionally this is being created as a web component, and currently this has zero build system. In order to view the demo you need to be on a browser that supports ES Modules.

## The Reason
I created this project because of the lack of proper number keyboards on Android. I have spent countless hours researching a clean way to invoke a consistent keyboard that supports numbers properly, including scientific notation, or even the basicis of a negative value, but to no avail. This article pretty much sums it up: https://www.filamentgroup.com/lab/type-number.html.

*With all that being said, I think this is something that would be very helpful in many different applications.*

## Basic roadmap for keyboard types:

* Number (with full support negative values and scientific notation!)
    * Also will add optional arrow keys for larger screens to allow you to bind to arrow key events
* Keyboard accessory bar
   * An additional accessory bar that can be used instead of a full custom keyboard. This will prove more useful cross all platforms
* Standard alphanumeric query style keyboard
* Telephone
* Other?


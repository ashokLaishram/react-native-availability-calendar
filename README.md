React Native Availability Calendar
A highly customizable React Native component that allows users, such as doctors or consultants, to visually define their available time slots for any given day. Built with TypeScript and react-native-paper.

This component is designed to be intuitive and efficient, featuring drag-to-create functionality and easy-to-use options for managing complex schedules.

Features
Visual Timeline View: A clean, scrollable 24-hour timeline for any day.

Drag-to-Create: Intuitively "paint" blocks of availability directly onto the calendar.

Slot Duration: Define how each availability block should be divided into appointment slots (e.g., 15, 20, 30 minutes).

Copy Schedule: Quickly copy a day's entire schedule to other days of the week with a single tap.

Highly Customizable: Use props to control the theme, colors, time intervals, and more.

Built with TypeScript: For robust, type-safe development.

Installation
To install the library, use npm or yarn:

npm install react-native-availability-calendar

# or

yarn add react-native-availability-calendar

This library has react-native-paper and react-native-vector-icons as peer dependencies. Please ensure they are installed and configured in your project.

npm install react-native-paper react-native-vector-icons

# or

yarn add react-native-paper react-native-vector-icons

Usage
Here's a basic example of how to use the AvailabilityCalendar in your app.

import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AvailabilityCalendar } from 'react-native-availability-calendar';

const DoctorScheduleScreen = () => {
const [schedule, setSchedule] = useState({});

const handleScheduleUpdate = (newSchedule) => {
console.log('Schedule has been updated:', newSchedule);
// Here, you would typically save the `newSchedule` object to your backend database.
setSchedule(newSchedule);
};

return (
<SafeAreaView style={styles.container}>
<AvailabilityCalendar
currentDate={new Date()}
onScheduleUpdate={handleScheduleUpdate}
initialSchedule={schedule}
/>
</SafeAreaView>
);
};

export default function App() {
// It's recommended to wrap your app in PaperProvider
return (
<PaperProvider>
<DoctorScheduleScreen />
</PaperProvider>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#F5F5F5', // A light background color
},
});

Props
Prop

Type

Default

Description

currentDate

Date

Required

The day the calendar should display.

onScheduleUpdate

(schedule: Schedule) => void

Required

Callback fired when any availability is created, updated, or deleted. Returns the entire schedule object.

initialSchedule

Schedule

{}

An object to pre-populate the calendar with an existing schedule.

slotDurationOptions

number[]

[15, 20, 30, 45, 60]

An array of numbers (in minutes) to show in the "Slot Duration" selector.

timeInterval

number

30

The visual increment of the timeline in minutes (e.g., 15, 30).

theme

object

{}

An object to customize colors (primaryColor, availabilityBlockColor, etc.).

headerComponent

React.ReactNode

null

A custom component to render in the header area.

footerComponent

React.ReactNode

null

A custom component to render in the footer area.

Data Structure
The schedule is managed as an object where keys are date strings ("yyyy-MM-dd") and values are an array of AvailabilityBlock objects for that day.

Example Schedule Object:

{
"2025-08-04": [
{
"id": "1660053641865",
"startTime": "2025-08-04T09:00:00.000Z",
"endTime": "2025-08-04T13:00:00.000Z",
"slotDurationMinutes": 20
}
],
"2025-08-05": [
// ... more availability blocks
]
}

Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Please feel free to submit a pull request.

License
Distributed under the MIT License. See LICENSE for more information.

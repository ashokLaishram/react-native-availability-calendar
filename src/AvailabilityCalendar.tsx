import { addMinutes, format, isBefore, isEqual, startOfDay } from 'date-fns';
import React, { useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Card, Paragraph, Title } from 'react-native-paper';

// --- TYPES ---
interface AvailabilityBlock {
  id: string;
  startTime: Date;
  endTime: Date;
  slotDurationMinutes: number;
}

interface Schedule {
  [date: string]: AvailabilityBlock[];
}

interface Theme {
  primaryColor?: string;
  accentColor?: string;

  availabilityBlockColor?: string;
  timelineLineColor?: string;
  fontFamily?: string;
}

interface Props {
  currentDate: Date;
  onScheduleUpdate: (newSchedule: Schedule) => void;
  initialSchedule?: Schedule;
  slotDurationOptions?: number[];
  timeInterval?: number;
  theme?: Theme;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
}

const HOUR_HEIGHT = 60;

// --- MAIN COMPONENT ---
export const AvailabilityCalendar: React.FC<Props> = ({
  currentDate,
  onScheduleUpdate,
  initialSchedule = {},
  slotDurationOptions = [15, 20, 30, 45, 60],
  timeInterval = 30,
  theme = {},
  headerComponent,
  footerComponent,
}) => {
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule);
  const [tempBlock, setTempBlock] = useState<AvailabilityBlock | null>(null);
  const [editingBlock, setEditingBlock] = useState<AvailabilityBlock | null>(
    null
  );
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCopyModalVisible, setCopyModalVisible] = useState(false);
  const [daysToCopyTo, setDaysToCopyTo] = useState<number[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const containerRef = useRef<View>(null);

  const todayKey = format(currentDate, 'yyyy-MM-dd');
  const todaysAvailability = schedule[todayKey] || [];

  const THEME = {
    primaryColor: theme.primaryColor || '#6200ee',
    accentColor: theme.accentColor || '#03dac4',
    availabilityBlockColor:
      theme.availabilityBlockColor || 'rgba(98, 0, 238, 0.2)',
    timelineLineColor: theme.timelineLineColor || '#e0e0e0',
    fontFamily: theme.fontFamily,
  };

  // --- HELPERS ---
  const timeToY = (date: Date): number => {
    const minutes = date.getHours() * 60 + date.getMinutes();
    return (minutes / 60) * HOUR_HEIGHT;
  };

  const yToTime = (y: number, date: Date): Date => {
    const totalMinutes = (y / HOUR_HEIGHT) * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes =
      Math.round((totalMinutes % 60) / timeInterval) * timeInterval;
    const newDate = startOfDay(date);
    return addMinutes(newDate, hours * 60 + minutes);
  };

  // --- CALLBACKS ---
  const updateSchedule = (newBlocks: AvailabilityBlock[]) => {
    const newSchedule = { ...schedule, [todayKey]: newBlocks };
    setSchedule(newSchedule);
    onScheduleUpdate(newSchedule);
  };

  // --- PAN RESPONDER FOR DRAG-TO-CREATE ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const startTime = yToTime(gestureState.y0, currentDate);
        setTempBlock({
          id: `temp-${Date.now()}`,
          startTime,
          endTime: startTime,
          slotDurationMinutes: slotDurationOptions[0],
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        if (tempBlock) {
          const endTime = yToTime(
            gestureState.y0 + gestureState.dy,
            currentDate
          );
          setTempBlock({ ...tempBlock, endTime });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!tempBlock) return;

        const { startTime } = tempBlock;
        let endTime = yToTime(gestureState.y0 + gestureState.dy, currentDate);

        if (isBefore(endTime, startTime)) {
          [endTime, tempBlock.startTime] = [startTime, endTime];
        }

        if (isEqual(startTime, endTime)) {
          setTempBlock(null);
          return;
        }

        const finalBlock = { ...tempBlock, endTime };
        setEditingBlock(finalBlock);
        setModalVisible(true);
        setTempBlock(null);
      },
    })
  ).current;

  // --- MODAL HANDLERS ---
  const handleSaveBlock = () => {
    if (!editingBlock) return;

    let existingBlocks = todaysAvailability.filter(
      (b) => b.id !== editingBlock.id
    );
    const updatedBlocks = [...existingBlocks, editingBlock].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    updateSchedule(updatedBlocks);
    setModalVisible(false);
    setEditingBlock(null);
  };

  const handleDeleteBlock = () => {
    if (!editingBlock) return;
    const newBlocks = todaysAvailability.filter(
      (b) => b.id !== editingBlock.id
    );
    updateSchedule(newBlocks);
    setModalVisible(false);
    setEditingBlock(null);
  };

  const handleOpenEditModal = (block: AvailabilityBlock) => {
    setEditingBlock(block);
    setModalVisible(true);
  };

  // --- COPY SCHEDULE HANDLERS ---
  const handleCopySchedule = () => {
    const currentDaySchedule = schedule[todayKey] || [];
    if (currentDaySchedule.length === 0) {
      alert('No schedule to copy for today.');
      return;
    }

    const scheduleToCopy = daysToCopyTo.reduce(
      (acc, dayOfWeek) => {
        const targetDate = new Date(currentDate);
        targetDate.setDate(
          currentDate.getDate() - currentDate.getDay() + dayOfWeek
        );
        const targetDateKey = format(targetDate, 'yyyy-MM-dd');

        acc[targetDateKey] = currentDaySchedule.map((block) => ({
          ...block,
          startTime: new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate(),
            block.startTime.getHours(),
            block.startTime.getMinutes()
          ),
          endTime: new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate(),
            block.endTime.getHours(),
            block.endTime.getMinutes()
          ),
        }));

        return acc;
      },
      { ...schedule }
    );

    setSchedule(scheduleToCopy);
    onScheduleUpdate(scheduleToCopy);
    setCopyModalVisible(false);
    setDaysToCopyTo([]);
  };

  const toggleDayToCopy = (dayIndex: number) => {
    setDaysToCopyTo((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  // --- RENDER METHODS ---
  const renderTimeline = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(
        <View
          key={`hour-${i}`}
          style={[styles.hourContainer, { height: HOUR_HEIGHT }]}
        >
          <Text style={[styles.hourText, { fontFamily: THEME.fontFamily }]}>
            {format(addMinutes(startOfDay(new Date()), i * 60), 'h a')}
          </Text>
          <View
            style={[
              styles.hourLine,
              { backgroundColor: THEME.timelineLineColor },
            ]}
          />
        </View>
      );
    }
    return hours;
  };

  const renderBlocks = () => {
    const blocksToRender = [...todaysAvailability];
    if (tempBlock) {
      blocksToRender.push(tempBlock);
    }

    return blocksToRender.map((block) => {
      const startY = timeToY(block.startTime);
      const endY = timeToY(block.endTime);
      const height = Math.max(0, endY - startY);

      if (height <= 0) return null;

      return (
        <TouchableOpacity
          key={block.id}
          style={[
            styles.availabilityBlock,
            {
              top: startY,
              height: height,
              backgroundColor: THEME.availabilityBlockColor,
              borderColor: THEME.primaryColor,
            },
          ]}
          onPress={() => handleOpenEditModal(block)}
        >
          <Text
            style={[
              styles.blockText,
              { fontFamily: THEME.fontFamily, color: THEME.primaryColor },
            ]}
          >
            {format(block.startTime, 'h:mm a')} -{' '}
            {format(block.endTime, 'h:mm a')}
          </Text>
          <Text
            style={[
              styles.blockSubText,
              { fontFamily: THEME.fontFamily, color: THEME.primaryColor },
            ]}
          >
            {block.slotDurationMinutes} min slots
          </Text>
        </TouchableOpacity>
      );
    });
  };

  const renderEditModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <Card style={styles.modalCard}>
          <Card.Content>
            <Title>Edit Availability</Title>
            {editingBlock && (
              <>
                <Paragraph>
                  From: {format(editingBlock.startTime, 'p')} To:{' '}
                  {format(editingBlock.endTime, 'p')}
                </Paragraph>
                <Title style={{ marginTop: 20 }}>Slot Duration</Title>
                <View style={styles.slotDurationContainer}>
                  {slotDurationOptions.map((duration) => (
                    <Button
                      key={duration}
                      mode={
                        editingBlock.slotDurationMinutes === duration
                          ? 'contained'
                          : 'outlined'
                      }
                      onPress={() =>
                        setEditingBlock({
                          ...editingBlock,
                          slotDurationMinutes: duration,
                        })
                      }
                      style={{ margin: 4 }}
                      color={THEME.primaryColor}
                    >
                      {duration} min
                    </Button>
                  ))}
                </View>
              </>
            )}
          </Card.Content>
          <Card.Actions>
            <Button onPress={handleDeleteBlock} color="red">
              Delete
            </Button>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button
              onPress={handleSaveBlock}
              mode="contained"
              color={THEME.primaryColor}
            >
              Save
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </Modal>
  );

  const renderCopyModal = () => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={isCopyModalVisible}
        onRequestClose={() => setCopyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Card style={styles.modalCard}>
            <Card.Content>
              <Title>Copy Today's Schedule To...</Title>
              <View style={styles.daysToCopyContainer}>
                {daysOfWeek.map((day, index) => (
                  <Button
                    key={day}
                    mode={
                      daysToCopyTo.includes(index) ? 'contained' : 'outlined'
                    }
                    onPress={() => toggleDayToCopy(index)}
                    style={{ margin: 4 }}
                    disabled={currentDate.getDay() === index}
                    color={THEME.primaryColor}
                  >
                    {day}
                  </Button>
                ))}
              </View>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setCopyModalVisible(false)}>Cancel</Button>
              <Button
                onPress={handleCopySchedule}
                mode="contained"
                color={THEME.primaryColor}
                disabled={daysToCopyTo.length === 0}
              >
                Apply
              </Button>
            </Card.Actions>
          </Card>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {headerComponent}
      <Button
        icon="content-copy"
        mode="contained"
        onPress={() => setCopyModalVisible(true)}
        style={{ margin: 10 }}
        color={THEME.primaryColor}
      >
        Copy Day's Schedule
      </Button>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View
          style={styles.timelineContainer}
          ref={containerRef}
          {...panResponder.panHandlers}
        >
          {renderTimeline()}
          {renderBlocks()}
        </View>
      </ScrollView>
      {footerComponent}
      {renderEditModal()}
      {renderCopyModal()}
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    paddingRight: 10,
  },
  timelineContainer: {
    flex: 1,
    paddingLeft: 60,
  },
  hourContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hourText: {
    fontSize: 12,
    color: '#888',
    position: 'absolute',
    left: -55,
    top: -8,
  },
  hourLine: {
    flex: 1,
    height: 1,
  },
  availabilityBlock: {
    position: 'absolute',
    left: 60,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    justifyContent: 'center',
  },
  blockText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  blockSubText: {
    fontSize: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    width: '90%',
    padding: 10,
  },
  slotDurationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 10,
  },
  daysToCopyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 10,
  },
});

export default AvailabilityCalendar;

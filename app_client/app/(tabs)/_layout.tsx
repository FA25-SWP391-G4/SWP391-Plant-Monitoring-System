import { Tabs } from "expo-router";
import { ImageBackground, Image, Text, View, TouchableOpacity, StyleSheet } from "react-native";

import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

// 1. Your existing TabIcon component (Unchanged)
function TabIcon({ focused, icon, title }: any) {
  if (focused) {
    return (
      <ImageBackground
        source={images.highlight}
        className="flex flex-row min-w-[112px] min-h-10 px-5 justify-center items-center rounded-full overflow-hidden"
      >
        <Image source={icon} tintColor="#0a5D29" className="size-5" />
        <Text className="text-secondary text-base font-semibold ml-2">
          {title}
        </Text>
      </ImageBackground>
    );
  }

  return (
    <View className="size-full justify-center items-center rounded-full">
      <ImageBackground
        source={images.button}
        className="flex flex-row min-w-[40px] min-h-10 justify-center items-center rounded-full overflow-hidden"
      >
        <Image source={icon} tintColor="#11270b" className="size-5" />
      </ImageBackground>
    </View>
  );
}

// 2. New Custom Tab Bar Component
// This replaces the rigid grid with a flexible "space-between" layout
const TabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem} 
          >
            {/* Render your icon logic here */}
            {typeof options.tabBarIcon === "function"
              ? options.tabBarIcon({ focused: isFocused })
              : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      // 3. Inject the custom tab bar here
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} title="Home" />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.book} title="Explore" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} title="Profile" />
          ),
        }}
      />

      <Tabs.Screen
        name="save"
        options={{
          title: "Save",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.bell} title="Save" />
          ),
        }}
      />
    </Tabs>
  );
}

// 4. Styles to match your original design perfectly
const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 36,
    flexDirection: "row",
    justifyContent: "space-between", // This pushes items to the sides
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 55,
    paddingLeft: 10, // Keeps margin between buttons and bar edge
    borderRadius: 50,
    height: 52,
    width: "75%",

    // Add shadow if needed to match design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  tabItem: {
    justifyContent: "center",
    alignItems: "center",
    // No flex: 1 here! We want them to be their natural size
  },
});
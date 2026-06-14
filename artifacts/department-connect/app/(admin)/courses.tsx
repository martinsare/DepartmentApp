import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

export default function AdminCourses() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { courses, sessions } = useData();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Courses</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {courses.map((course) => {
          const courseSessions = sessions.filter((s) => s.course_id === course.id);
          const activeSessions = courseSessions.filter((s) => s.status === "scheduled" || s.status === "ongoing").length;
          return (
            <View key={course.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.codeWrap, { backgroundColor: colors.primary }]}>
                  <Text style={styles.codeText}>{course.code}</Text>
                </View>
                <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.muted }]}>
                  <Feather name="edit-2" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.courseTitle, { color: colors.foreground }]}>{course.title}</Text>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Feather name="user" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{course.lecturer_name}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Feather name="users" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{course.enrolled_count} enrolled</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{courseSessions.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Sessions</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: "#10B981" }]}>{activeSessions}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Upcoming</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{course.enrolled_count}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Students</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  codeWrap: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  codeText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  editBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  courseTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 10 },
  infoRow: { gap: 6, marginBottom: 12 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginBottom: 12 },
  statsRow: { flexDirection: "row" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
});

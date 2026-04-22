import { integer, json, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const matchStatusEnum = pgEnum("match_status", ["scheduled", "live", "finished"]);

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  sport: varchar("sport", { length: 50 }).notNull(),
  homeTeam: varchar("home_team", { length: 255 }).notNull(),
  awayTeam: varchar("away_team", { length: 255 }).notNull(),
  status: matchStatusEnum("status").default("scheduled").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  homeScore: integer("home_score").default(0).notNull(),
  awayScore: integer("away_score").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentary = pgTable("commentary", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .references(() => matches.id)
    .notNull(),
  minute: integer("minute"),
  sequence: integer("sequence"),
  period: varchar("period", { length: 50 }),
  eventType: varchar("event_type", { length: 50 }),
  actor: varchar("actor", { length: 255 }),
  team: varchar("team", { length: 255 }),
  message: text("message").notNull(),
  metadata: json("metadata"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentaries = commentary;

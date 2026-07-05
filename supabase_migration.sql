--
-- PostgreSQL database dump
--



-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.zones DROP CONSTRAINT IF EXISTS zones_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.watering_history DROP CONSTRAINT IF EXISTS fk_wateringhistory_plant;
ALTER TABLE IF EXISTS ONLY public.watering_history DROP CONSTRAINT IF EXISTS fk_wateringhistory_device;
ALTER TABLE IF EXISTS ONLY public.sensors_data DROP CONSTRAINT IF EXISTS fk_sensordata_device;
ALTER TABLE IF EXISTS ONLY public.pump_schedules DROP CONSTRAINT IF EXISTS fk_schedules_plant;
ALTER TABLE IF EXISTS ONLY public.plants DROP CONSTRAINT IF EXISTS fk_plants_zone;
ALTER TABLE IF EXISTS ONLY public.plants DROP CONSTRAINT IF EXISTS fk_plants_user;
ALTER TABLE IF EXISTS ONLY public.plants DROP CONSTRAINT IF EXISTS fk_plants_profile;
ALTER TABLE IF EXISTS ONLY public.plants DROP CONSTRAINT IF EXISTS fk_plants_device;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS fk_payments_user;
ALTER TABLE IF EXISTS ONLY public.chat_history DROP CONSTRAINT IF EXISTS fk_chathistory_user;
ALTER TABLE IF EXISTS ONLY public.alerts DROP CONSTRAINT IF EXISTS fk_alerts_user;
ALTER TABLE IF EXISTS ONLY public.ai_models DROP CONSTRAINT IF EXISTS fk_ai_models_admin;
DROP INDEX IF EXISTS public.idx_wateringhistory_plant_timestamp;
DROP INDEX IF EXISTS public.idx_users_password_reset_token;
DROP INDEX IF EXISTS public.idx_systemlogs_timestamp_level;
DROP INDEX IF EXISTS public.idx_sensordata_device_timestamp;
DROP INDEX IF EXISTS public.idx_oauth_states_created_at;
DROP INDEX IF EXISTS public.idx_alerts_user_status;
DROP INDEX IF EXISTS public."IDX_session_expire";
ALTER TABLE IF EXISTS ONLY public.zones DROP CONSTRAINT IF EXISTS zones_pkey;
ALTER TABLE IF EXISTS ONLY public.watering_history DROP CONSTRAINT IF EXISTS watering_history_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_google_id_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.system_logs DROP CONSTRAINT IF EXISTS system_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.user_sessions DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE IF EXISTS ONLY public.sensors_data DROP CONSTRAINT IF EXISTS sensors_data_pkey;
ALTER TABLE IF EXISTS ONLY public.pump_schedules DROP CONSTRAINT IF EXISTS pump_schedules_pkey;
ALTER TABLE IF EXISTS ONLY public.plants DROP CONSTRAINT IF EXISTS plants_pkey;
ALTER TABLE IF EXISTS ONLY public.plant_profiles DROP CONSTRAINT IF EXISTS plant_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_vnpay_txn_ref_key;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY public.oauth_states DROP CONSTRAINT IF EXISTS oauth_states_pkey;
ALTER TABLE IF EXISTS ONLY public.devices DROP CONSTRAINT IF EXISTS devices_pkey;
ALTER TABLE IF EXISTS ONLY public.devices DROP CONSTRAINT IF EXISTS devices_device_key_key;
ALTER TABLE IF EXISTS ONLY public.chat_history DROP CONSTRAINT IF EXISTS chat_history_pkey;
ALTER TABLE IF EXISTS ONLY public.alerts DROP CONSTRAINT IF EXISTS alerts_pkey;
ALTER TABLE IF EXISTS ONLY public.ai_models DROP CONSTRAINT IF EXISTS ai_models_pkey;
ALTER TABLE IF EXISTS public.zones ALTER COLUMN zone_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.watering_history ALTER COLUMN history_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_logs ALTER COLUMN log_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sensors_data ALTER COLUMN data_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pump_schedules ALTER COLUMN schedule_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.plants ALTER COLUMN plant_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.plant_profiles ALTER COLUMN profile_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payments ALTER COLUMN payment_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.chat_history ALTER COLUMN chat_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.alerts ALTER COLUMN alert_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ai_models ALTER COLUMN model_id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.zones_zone_id_seq;
DROP TABLE IF EXISTS public.zones;
DROP SEQUENCE IF EXISTS public.watering_history_history_id_seq;
DROP TABLE IF EXISTS public.watering_history;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_sessions;
DROP SEQUENCE IF EXISTS public.system_logs_log_id_seq;
DROP TABLE IF EXISTS public.system_logs;
DROP SEQUENCE IF EXISTS public.sensors_data_data_id_seq;
DROP TABLE IF EXISTS public.sensors_data;
DROP SEQUENCE IF EXISTS public.pump_schedules_schedule_id_seq;
DROP TABLE IF EXISTS public.pump_schedules;
DROP SEQUENCE IF EXISTS public.plants_plant_id_seq;
DROP TABLE IF EXISTS public.plants;
DROP SEQUENCE IF EXISTS public.plant_profiles_profile_id_seq;
DROP TABLE IF EXISTS public.plant_profiles;
DROP SEQUENCE IF EXISTS public.payments_payment_id_seq;
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.oauth_states;
DROP TABLE IF EXISTS public.devices;
DROP SEQUENCE IF EXISTS public.chat_history_chat_id_seq;
DROP TABLE IF EXISTS public.chat_history;
DROP SEQUENCE IF EXISTS public.alerts_alert_id_seq;
DROP TABLE IF EXISTS public.alerts;
DROP SEQUENCE IF EXISTS public.ai_models_model_id_seq;
DROP TABLE IF EXISTS public.ai_models;
DROP FUNCTION IF EXISTS public.update_user_role_from_subscription();
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: update_user_role_from_subscription(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_user_role_from_subscription() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
          -- Update user role based on active subscription
          UPDATE users 
          SET role = CASE 
              WHEN EXISTS (
                  SELECT 1 FROM subscriptions s 
                  JOIN plans p ON s.plan_id = p.id 
                  WHERE s.user_id = COALESCE(NEW.user_id, OLD.user_id)
                  AND s.is_active = TRUE 
                  AND (s.sub_end IS NULL OR s.sub_end > CURRENT_TIMESTAMP)
                  AND p.is_admin_only = TRUE
              ) THEN 'admin'
              WHEN EXISTS (
                  SELECT 1 FROM subscriptions s 
                  JOIN plans p ON s.plan_id = p.id 
                  WHERE s.user_id = COALESCE(NEW.user_id, OLD.user_id)
                  AND s.is_active = TRUE 
                  AND (s.sub_end IS NULL OR s.sub_end > CURRENT_TIMESTAMP)
                  AND p.name IN ('Premium', 'Ultimate')
              ) THEN 'premium'
              ELSE 'regular'
          END
          WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
          
          RETURN COALESCE(NEW, OLD);
      END;
      $$;


ALTER FUNCTION public.update_user_role_from_subscription() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_models (
    model_id integer NOT NULL,
    model_name character varying(100) NOT NULL,
    version character varying(20),
    file_path character varying(255) NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    uploaded_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ai_models OWNER TO postgres;

--
-- Name: ai_models_model_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_models_model_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_models_model_id_seq OWNER TO postgres;

--
-- Name: ai_models_model_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_models_model_id_seq OWNED BY public.ai_models.model_id;


--
-- Name: alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alerts (
    alert_id integer NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    status character varying(30) DEFAULT 'unread'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT alerts_status_check CHECK (((status)::text = ANY ((ARRAY['unread'::character varying, 'read'::character varying])::text[])))
);


ALTER TABLE public.alerts OWNER TO postgres;

--
-- Name: alerts_alert_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alerts_alert_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alerts_alert_id_seq OWNER TO postgres;

--
-- Name: alerts_alert_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alerts_alert_id_seq OWNED BY public.alerts.alert_id;


--
-- Name: chat_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_history (
    chat_id integer NOT NULL,
    user_id uuid NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_message text,
    ai_response text
);


ALTER TABLE public.chat_history OWNER TO postgres;

--
-- Name: chat_history_chat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_history_chat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_history_chat_id_seq OWNER TO postgres;

--
-- Name: chat_history_chat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_history_chat_id_seq OWNED BY public.chat_history.chat_id;


--
-- Name: devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devices (
    user_id uuid NOT NULL,
    device_key character varying(36) NOT NULL,
    device_name character varying(100),
    status character varying(30) DEFAULT 'offline'::character varying NOT NULL,
    last_seen timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT devices_status_check CHECK (((status)::text = ANY ((ARRAY['online'::character varying, 'offline'::character varying, 'error'::character varying])::text[])))
);


ALTER TABLE public.devices OWNER TO postgres;

--
-- Name: oauth_states; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.oauth_states (
    state character varying(255) NOT NULL,
    session_id character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    used boolean DEFAULT false
);


ALTER TABLE public.oauth_states OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    payment_id integer NOT NULL,
    user_id uuid NOT NULL,
    vnpay_txn_ref character varying(255),
    amount numeric(10,2) NOT NULL,
    status character varying(30) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['completed'::character varying, 'failed'::character varying, 'pending'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_payment_id_seq OWNER TO postgres;

--
-- Name: payments_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_payment_id_seq OWNED BY public.payments.payment_id;


--
-- Name: plant_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plant_profiles (
    profile_id integer NOT NULL,
    species_name character varying(100) NOT NULL,
    description text,
    ideal_moisture integer
);


ALTER TABLE public.plant_profiles OWNER TO postgres;

--
-- Name: plant_profiles_profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plant_profiles_profile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plant_profiles_profile_id_seq OWNER TO postgres;

--
-- Name: plant_profiles_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plant_profiles_profile_id_seq OWNED BY public.plant_profiles.profile_id;


--
-- Name: plants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plants (
    plant_id integer NOT NULL,
    user_id uuid NOT NULL,
    device_key character varying(36),
    profile_id integer,
    custom_name character varying(100) NOT NULL,
    moisture_threshold integer NOT NULL,
    auto_watering_on boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'healthy'::character varying,
    image character varying(255),
    notes text,
    species_name character varying(100),
    zone_id integer,
    device_id uuid
);


ALTER TABLE public.plants OWNER TO postgres;

--
-- Name: plants_plant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plants_plant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plants_plant_id_seq OWNER TO postgres;

--
-- Name: plants_plant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plants_plant_id_seq OWNED BY public.plants.plant_id;


--
-- Name: pump_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pump_schedules (
    schedule_id integer NOT NULL,
    plant_id integer NOT NULL,
    cron_expression character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    duration_seconds integer
);


ALTER TABLE public.pump_schedules OWNER TO postgres;

--
-- Name: pump_schedules_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pump_schedules_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pump_schedules_schedule_id_seq OWNER TO postgres;

--
-- Name: pump_schedules_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pump_schedules_schedule_id_seq OWNED BY public.pump_schedules.schedule_id;


--
-- Name: sensors_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sensors_data (
    data_id bigint NOT NULL,
    device_key character(36) NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    soil_moisture double precision,
    temperature double precision,
    air_humidity double precision,
    light_intensity double precision
);


ALTER TABLE public.sensors_data OWNER TO postgres;

--
-- Name: sensors_data_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sensors_data_data_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sensors_data_data_id_seq OWNER TO postgres;

--
-- Name: sensors_data_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sensors_data_data_id_seq OWNED BY public.sensors_data.data_id;


--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_logs (
    log_id bigint NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    log_level character varying(20),
    source character varying(100),
    message text NOT NULL
);


ALTER TABLE public.system_logs OWNER TO postgres;

--
-- Name: system_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_logs_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_logs_log_id_seq OWNER TO postgres;

--
-- Name: system_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_logs_log_id_seq OWNED BY public.system_logs.log_id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255),
    given_name character varying(100),
    family_name character varying(100),
    role character varying(30) DEFAULT 'regular'::character varying NOT NULL,
    notification_prefs jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    password_reset_token character varying(255),
    password_reset_expires timestamp without time zone,
    google_id character varying(255),
    google_refresh_token text,
    profile_picture text,
    language_preference character varying(10) DEFAULT 'en'::character varying NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['regular'::character varying, 'premium'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: watering_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.watering_history (
    history_id integer NOT NULL,
    plant_id integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trigger_type character varying(30) NOT NULL,
    duration_seconds integer,
    device_key character varying(36),
    CONSTRAINT watering_history_trigger_type_check CHECK (((trigger_type)::text = ANY ((ARRAY['manual'::character varying, 'automatic_threshold'::character varying, 'schedule'::character varying, 'ai_prediction'::character varying])::text[])))
);


ALTER TABLE public.watering_history OWNER TO postgres;

--
-- Name: watering_history_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.watering_history_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.watering_history_history_id_seq OWNER TO postgres;

--
-- Name: watering_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.watering_history_history_id_seq OWNED BY public.watering_history.history_id;


--
-- Name: zones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zones (
    zone_id integer NOT NULL,
    zone_name character varying(100) NOT NULL,
    description text,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.zones OWNER TO postgres;

--
-- Name: zones_zone_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.zones_zone_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.zones_zone_id_seq OWNER TO postgres;

--
-- Name: zones_zone_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.zones_zone_id_seq OWNED BY public.zones.zone_id;


--
-- Name: ai_models model_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_models ALTER COLUMN model_id SET DEFAULT nextval('public.ai_models_model_id_seq'::regclass);


--
-- Name: alerts alert_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts ALTER COLUMN alert_id SET DEFAULT nextval('public.alerts_alert_id_seq'::regclass);


--
-- Name: chat_history chat_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_history ALTER COLUMN chat_id SET DEFAULT nextval('public.chat_history_chat_id_seq'::regclass);


--
-- Name: payments payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN payment_id SET DEFAULT nextval('public.payments_payment_id_seq'::regclass);


--
-- Name: plant_profiles profile_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plant_profiles ALTER COLUMN profile_id SET DEFAULT nextval('public.plant_profiles_profile_id_seq'::regclass);


--
-- Name: plants plant_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plants ALTER COLUMN plant_id SET DEFAULT nextval('public.plants_plant_id_seq'::regclass);


--
-- Name: pump_schedules schedule_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pump_schedules ALTER COLUMN schedule_id SET DEFAULT nextval('public.pump_schedules_schedule_id_seq'::regclass);


--
-- Name: sensors_data data_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensors_data ALTER COLUMN data_id SET DEFAULT nextval('public.sensors_data_data_id_seq'::regclass);


--
-- Name: system_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs ALTER COLUMN log_id SET DEFAULT nextval('public.system_logs_log_id_seq'::regclass);


--
-- Name: watering_history history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watering_history ALTER COLUMN history_id SET DEFAULT nextval('public.watering_history_history_id_seq'::regclass);


--
-- Name: zones zone_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zones ALTER COLUMN zone_id SET DEFAULT nextval('public.zones_zone_id_seq'::regclass);


--
-- Name: ai_models ai_models_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT ai_models_pkey PRIMARY KEY (model_id);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (alert_id);


--
-- Name: chat_history chat_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_history
    ADD CONSTRAINT chat_history_pkey PRIMARY KEY (chat_id);


--
-- Name: devices devices_device_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_device_key_key UNIQUE (device_key);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (device_key);


--
-- Name: oauth_states oauth_states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_states
    ADD CONSTRAINT oauth_states_pkey PRIMARY KEY (state);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- Name: payments payments_vnpay_txn_ref_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_vnpay_txn_ref_key UNIQUE (vnpay_txn_ref);


--
-- Name: plant_profiles plant_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plant_profiles
    ADD CONSTRAINT plant_profiles_pkey PRIMARY KEY (profile_id);


--
-- Name: plants plants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plants
    ADD CONSTRAINT plants_pkey PRIMARY KEY (plant_id);


--
-- Name: pump_schedules pump_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pump_schedules
    ADD CONSTRAINT pump_schedules_pkey PRIMARY KEY (schedule_id);


--
-- Name: sensors_data sensors_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensors_data
    ADD CONSTRAINT sensors_data_pkey PRIMARY KEY (data_id);


--
-- Name: user_sessions session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (log_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: watering_history watering_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watering_history
    ADD CONSTRAINT watering_history_pkey PRIMARY KEY (history_id);


--
-- Name: zones zones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zones
    ADD CONSTRAINT zones_pkey PRIMARY KEY (zone_id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.user_sessions USING btree (expire);


--
-- Name: idx_alerts_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_user_status ON public.alerts USING btree (user_id, status);


--
-- Name: idx_oauth_states_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oauth_states_created_at ON public.oauth_states USING btree (created_at);


--
-- Name: idx_sensordata_device_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sensordata_device_timestamp ON public.sensors_data USING btree (device_key, "timestamp");


--
-- Name: idx_systemlogs_timestamp_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_systemlogs_timestamp_level ON public.system_logs USING btree ("timestamp", log_level);


--
-- Name: idx_users_password_reset_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_password_reset_token ON public.users USING btree (password_reset_token);


--
-- Name: idx_wateringhistory_plant_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wateringhistory_plant_timestamp ON public.watering_history USING btree (plant_id, "timestamp");


--
-- Name: ai_models fk_ai_models_admin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT fk_ai_models_admin FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: alerts fk_alerts_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT fk_alerts_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_history fk_chathistory_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_history
    ADD CONSTRAINT fk_chathistory_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments fk_payments_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plants fk_plants_device; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plants
    ADD CONSTRAINT fk_plants_device FOREIGN KEY (device_key) REFERENCES public.devices(device_key) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plants fk_plants_profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plants
    ADD CONSTRAINT fk_plants_profile FOREIGN KEY (profile_id) REFERENCES public.plant_profiles(profile_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: plants fk_plants_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plants
    ADD CONSTRAINT fk_plants_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plants fk_plants_zone; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plants
    ADD CONSTRAINT fk_plants_zone FOREIGN KEY (zone_id) REFERENCES public.zones(zone_id) ON DELETE SET NULL;


--
-- Name: pump_schedules fk_schedules_plant; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pump_schedules
    ADD CONSTRAINT fk_schedules_plant FOREIGN KEY (plant_id) REFERENCES public.plants(plant_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sensors_data fk_sensordata_device; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensors_data
    ADD CONSTRAINT fk_sensordata_device FOREIGN KEY (device_key) REFERENCES public.devices(device_key) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: watering_history fk_wateringhistory_device; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watering_history
    ADD CONSTRAINT fk_wateringhistory_device FOREIGN KEY (device_key) REFERENCES public.devices(device_key) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: watering_history fk_wateringhistory_plant; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watering_history
    ADD CONSTRAINT fk_wateringhistory_plant FOREIGN KEY (plant_id) REFERENCES public.plants(plant_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: zones zones_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zones
    ADD CONSTRAINT zones_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict OoMAzFq7HM0TnjglowUX9uUbkHEP9OIFQ5VVmtillDZavhPkfifE8f1UWB5lKMU


--
-- Data Inserts
--

-- Data for users
INSERT INTO public.users ("user_id", "email", "password_hash", "given_name", "family_name", "role", "notification_prefs", "created_at", "password_reset_token", "password_reset_expires", "google_id", "google_refresh_token", "profile_picture", "language_preference") VALUES ('12404c30-c5fe-4d38-846a-2be39b247407', 'testuser@example.com', NULL, 'Test', 'User', 'regular', NULL, '2025-11-02T16:58:14.856Z', NULL, NULL, NULL, NULL, NULL, 'en');
INSERT INTO public.users ("user_id", "email", "password_hash", "given_name", "family_name", "role", "notification_prefs", "created_at", "password_reset_token", "password_reset_expires", "google_id", "google_refresh_token", "profile_picture", "language_preference") VALUES ('3fc5c67c-dc66-47e6-bdbb-761f2316b823', 'tuanhuy.pham210@gmail.com', NULL, 'John', 'Payne', 'regular', 'false'::jsonb, '2026-06-26T03:43:06.110Z', NULL, NULL, '110244218475241813281', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocJFy2AWP69XnlMBWXNcasRczbOAhQfymKw_FdC0nn_5wsiLwqSy=s100', 'en');
INSERT INTO public.users ("user_id", "email", "password_hash", "given_name", "family_name", "role", "notification_prefs", "created_at", "password_reset_token", "password_reset_expires", "google_id", "google_refresh_token", "profile_picture", "language_preference") VALUES ('bf83dd9f-70dc-4402-aa16-e37c9bcf798d', 'huyp77705@gmail.com', NULL, 'normal', 'person', 'regular', 'false'::jsonb, '2026-06-26T03:53:39.289Z', NULL, NULL, '112051416855393484236', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocLkNkax0y4m_HnfpptzCiZHAy1fr8XICGNe_5kSt4qhF63gnIBJ=s100', 'en');

-- Data for devices
INSERT INTO public.devices ("user_id", "device_key", "device_name", "status", "last_seen", "created_at") VALUES ('12404c30-c5fe-4d38-846a-2be39b247407', '48af5cfe8ce0', 'ESP32 Smart Plant Sensor', 'online', NULL, '2025-11-02T17:14:45.520Z');

-- Data for oauth_states
INSERT INTO public.oauth_states ("state", "session_id", "created_at", "used") VALUES ('e69284cf6f6764840c255b2c68751e351bcbdb891d3c487a3aba45154a99de22', 'LBErSvz85NchvGmiuqKsRMFjJioqVjCU', '2026-06-26T03:42:27.572Z', true);
INSERT INTO public.oauth_states ("state", "session_id", "created_at", "used") VALUES ('8a31c86d860bf5cff5cc11aa5bb7a0f1c05e4fa7f1f4420e37758a308c87c7ff', 'LBErSvz85NchvGmiuqKsRMFjJioqVjCU', '2026-06-26T03:48:53.915Z', true);
INSERT INTO public.oauth_states ("state", "session_id", "created_at", "used") VALUES ('aec67d2d478a57809dbb84aa69f835b798e8cc5a4215dd0e4478457172578cf8', 'LBErSvz85NchvGmiuqKsRMFjJioqVjCU', '2026-06-26T03:53:05.325Z', true);
INSERT INTO public.oauth_states ("state", "session_id", "created_at", "used") VALUES ('0a92d66b1a726c08c832b629e2f356e68dc69c37613078d94929c25403155a02', 'LBErSvz85NchvGmiuqKsRMFjJioqVjCU', '2026-06-26T03:53:54.410Z', true);

-- Data for zones
INSERT INTO public.zones ("zone_id", "zone_name", "description", "user_id", "created_at", "updated_at") VALUES (1, 'Indoor Herb Zone', 'Zone for basil, mint, and other herbs near the kitchen window.', '12404c30-c5fe-4d38-846a-2be39b247407', '2025-11-05T01:56:04.773Z', '2025-11-05T01:56:04.773Z');

-- Data for plants
INSERT INTO public.plants ("plant_id", "user_id", "device_key", "profile_id", "custom_name", "moisture_threshold", "auto_watering_on", "created_at", "updated_at", "status", "image", "notes", "species_name", "zone_id", "device_id") VALUES (1, '12404c30-c5fe-4d38-846a-2be39b247407', '48af5cfe8ce0', NULL, 'Basil Plant', 35, true, '2025-11-02T17:16:27.084Z', '2025-11-05T01:58:34.342Z', 'healthy', NULL, NULL, 'Ocimum basilicum', 1, NULL);

-- Data for pump_schedules
INSERT INTO public.pump_schedules ("schedule_id", "plant_id", "cron_expression", "is_active", "duration_seconds") VALUES (39, 1, '51 15 * * ', true, NULL);

-- Data for watering_history
INSERT INTO public.watering_history ("history_id", "plant_id", "timestamp", "trigger_type", "duration_seconds", "device_key") VALUES (1, 1, '2025-11-10T13:35:28.131Z', 'manual', 30, NULL);
INSERT INTO public.watering_history ("history_id", "plant_id", "timestamp", "trigger_type", "duration_seconds", "device_key") VALUES (2, 1, '2025-11-10T13:37:19.388Z', 'manual', 30, NULL);
INSERT INTO public.watering_history ("history_id", "plant_id", "timestamp", "trigger_type", "duration_seconds", "device_key") VALUES (3, 1, '2025-11-10T13:38:43.958Z', 'manual', 30, NULL);
INSERT INTO public.watering_history ("history_id", "plant_id", "timestamp", "trigger_type", "duration_seconds", "device_key") VALUES (4, 1, '2025-11-10T13:40:21.488Z', 'manual', 27, NULL);
INSERT INTO public.watering_history ("history_id", "plant_id", "timestamp", "trigger_type", "duration_seconds", "device_key") VALUES (5, 1, '2025-11-10T13:47:58.524Z', 'manual', 30, NULL);

-- Data for system_logs
INSERT INTO public.system_logs ("log_id", "timestamp", "log_level", "source", "message") VALUES ('1', '2025-11-02T16:39:29.657Z', 'INFO', 'NotificationService', 'WebSocket notification service initialized');
INSERT INTO public.system_logs ("log_id", "timestamp", "log_level", "source", "message") VALUES ('2', '2025-11-02T17:20:38.153Z', 'INFO', 'NotificationService', 'WebSocket notification service initialized');
INSERT INTO public.system_logs ("log_id", "timestamp", "log_level", "source", "message") VALUES ('3', '2025-11-02T17:21:00.586Z', 'ERROR', 'plantController', 'Error fetching plants for user undefined: column p.device_id does not exist');
INSERT INTO public.system_logs ("log_id", "timestamp", "log_level", "source", "message") VALUES ('4', '2025-11-02T17:21:05.366Z', 'ERROR', 'plantController', 'Error fetching plants for user undefined: column p.device_id does not exist');
INSERT INTO public.system_logs ("log_id", "timestamp", "log_level", "source", "message") VALUES ('5', '2025-11-02T17:24:32.435Z', 'INFO', 'NotificationService', 'WebSocket notification service initialized');

-- Data for sensors_data
INSERT INTO public.sensors_data ("data_id", "device_key", "timestamp", "soil_moisture", "temperature", "air_humidity", "light_intensity") VALUES ('6240', '48af5cfe8ce0                        ', '2026-06-22T07:30:37.000Z', 0, 26.1, 61.7, 345);


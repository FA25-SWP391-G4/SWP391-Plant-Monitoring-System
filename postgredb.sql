--
-- PostgreSQL database dump
--

\restrict PqLPPRfAnaU1R09IoPBIWyLie4zcSfINsvXuBsqRuDxwUTKbr2PEiVm4vFsT0ME

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    uploaded_by uuid NOT NULL
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
    message text NOT NULL,
    status character varying(30) DEFAULT 'unread'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id uuid NOT NULL,
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
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_message text,
    ai_response text,
    user_id uuid NOT NULL
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
    device_key character(36) NOT NULL,
    device_name character varying(100),
    status character varying(30) DEFAULT 'offline'::character varying NOT NULL,
    last_seen timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id uuid NOT NULL,
    CONSTRAINT devices_status_check CHECK (((status)::text = ANY ((ARRAY['online'::character varying, 'offline'::character varying, 'error'::character varying])::text[])))
);


ALTER TABLE public.devices OWNER TO postgres;

--
-- Name: health_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.health_history (
    id integer NOT NULL,
    plant_id integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    health_score double precision NOT NULL,
    moisture_factor double precision NOT NULL,
    temperature_factor double precision NOT NULL,
    humidity_factor double precision NOT NULL,
    light_factor double precision NOT NULL,
    notes text,
    status character varying(255)
);


ALTER TABLE public.health_history OWNER TO postgres;

--
-- Name: health_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.health_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_history_id_seq OWNER TO postgres;

--
-- Name: health_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.health_history_id_seq OWNED BY public.health_history.id;


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
    vnpay_txn_ref character varying(255),
    amount numeric(10,2) NOT NULL,
    status character varying(30) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id uuid NOT NULL,
    order_id character varying(255),
    order_info text,
    bank_code character varying(50),
    ip_address inet,
    transaction_no character varying(255),
    pay_date character varying(14),
    response_code character varying(10),
    transaction_status character varying(50),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'SUCCESS'::character varying, 'FAILED'::character varying, 'completed'::character varying, 'failed'::character varying, 'pending'::character varying])::text[])))
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
    profile_id integer,
    custom_name character varying(100) NOT NULL,
    moisture_threshold integer NOT NULL,
    auto_watering_on boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(20) DEFAULT 'healthy'::character varying,
    user_id uuid NOT NULL,
    device_key character(36),
    image character varying(255),
    zone_id integer,
    notes text
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
    is_active boolean DEFAULT true NOT NULL
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
    "timestamp" timestamp without time zone NOT NULL,
    soil_moisture double precision,
    temperature double precision,
    air_humidity double precision,
    light_intensity double precision,
    plant_id integer,
    device_key character(36)
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
    email character varying(100) NOT NULL,
    password_hash character varying(255),
    given_name character varying(100),
    role character varying(30) DEFAULT 'Regular'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    password_reset_token character varying(255),
    password_reset_expires timestamp without time zone,
    google_id character varying(255),
    profile_picture character varying(255),
    family_name character varying(100),
    google_refresh_token character varying(255),
    notification_prefs boolean,
    phone_number character varying(255),
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    settings jsonb
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: COLUMN users.settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.settings IS 'User settings in JSON format including dashboard widgets, appearance, language, notifications, and privacy preferences';


--
-- Name: watering_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.watering_history (
    history_id integer NOT NULL,
    plant_id integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trigger_type character varying(30) NOT NULL,
    duration_seconds integer,
    device_key character(36),
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
    user_id uuid NOT NULL,
    plant_id integer,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
-- Name: health_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.health_history ALTER COLUMN id SET DEFAULT nextval('public.health_history_id_seq'::regclass);


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
-- Name: health_history health_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.health_history
    ADD CONSTRAINT health_history_pkey PRIMARY KEY (id);


--
-- Name: oauth_states oauth_states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_states
    ADD CONSTRAINT oauth_states_pkey PRIMARY KEY (state);


--
-- Name: payments payments_order_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_key UNIQUE (order_id);


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
-- Name: zones unique_zone_name_per_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zones
    ADD CONSTRAINT unique_zone_name_per_user UNIQUE (user_id, zone_name);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_user_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_uuid_unique UNIQUE (user_id);


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
-- Name: IDX_user_sessions_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_user_sessions_expire" ON public.user_sessions USING btree (expire);


--
-- Name: idx_ai_models_uploaded_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_models_uploaded_by ON public.ai_models USING btree (uploaded_by);


--
-- Name: idx_alerts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_user_id ON public.alerts USING btree (user_id);


--
-- Name: idx_devices_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_devices_user_id ON public.devices USING btree (user_id);


--
-- Name: idx_health_history_plant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_health_history_plant_id ON public.health_history USING btree (plant_id);


--
-- Name: idx_health_history_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_health_history_timestamp ON public.health_history USING btree ("timestamp");


--
-- Name: idx_oauth_states_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oauth_states_created_at ON public.oauth_states USING btree (created_at);


--
-- Name: idx_payments_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_order_id ON public.payments USING btree (order_id);


--
-- Name: idx_payments_transaction_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_transaction_no ON public.payments USING btree (transaction_no);


--
-- Name: idx_payments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_user_id ON public.payments USING btree (user_id);


--
-- Name: idx_payments_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_user_status ON public.payments USING btree (user_id, status);


--
-- Name: idx_plants_device_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plants_device_id ON public.plants USING btree (device_key);


--
-- Name: idx_plants_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plants_user_id ON public.plants USING btree (user_id);


--
-- Name: idx_plants_zone_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plants_zone_id ON public.plants USING btree (zone_id);


--
-- Name: idx_sensors_data_device_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sensors_data_device_id ON public.sensors_data USING btree (device_key);


--
-- Name: idx_systemlogs_timestamp_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_systemlogs_timestamp_level ON public.system_logs USING btree ("timestamp", log_level);


--
-- Name: idx_users_google_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_google_id ON public.users USING btree (google_id);


--
-- Name: idx_users_password_reset_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_password_reset_token ON public.users USING btree (password_reset_token);


--
-- Name: idx_users_settings; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_settings ON public.users USING gin (settings);


--
-- Name: idx_wateringhistory_plant_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wateringhistory_plant_timestamp ON public.watering_history USING btree (plant_id, "timestamp");


--
-- Name: idx_zones_plant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_zones_plant_id ON public.zones USING btree (plant_id);


--
-- Name: idx_zones_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_zones_user_id ON public.zones USING btree (user_id);


--
-- Name: payments update_payments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_history chat_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_history
    ADD CONSTRAINT chat_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: devices devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: payments fk_payments_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: watering_history fk_wateringhistory_plant; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watering_history
    ADD CONSTRAINT fk_wateringhistory_plant FOREIGN KEY (plant_id) REFERENCES public.plants(plant_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: zones fk_zones_plant; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zones
    ADD CONSTRAINT fk_zones_plant FOREIGN KEY (plant_id) REFERENCES public.plants(plant_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: zones fk_zones_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zones
    ADD CONSTRAINT fk_zones_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: health_history health_history_plant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.health_history
    ADD CONSTRAINT health_history_plant_id_fkey FOREIGN KEY (plant_id) REFERENCES public.plants(plant_id) ON DELETE CASCADE;


--
-- Name: plants plants_device_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plants
    ADD CONSTRAINT plants_device_key_fkey FOREIGN KEY (device_key) REFERENCES public.devices(device_key) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plants plants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plants
    ADD CONSTRAINT plants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plants plants_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plants
    ADD CONSTRAINT plants_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones(zone_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sensors_data sensors_data_plant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensors_data
    ADD CONSTRAINT sensors_data_plant_id_fkey FOREIGN KEY (plant_id) REFERENCES public.plants(plant_id);


--
-- PostgreSQL database dump complete
--

\unrestrict PqLPPRfAnaU1R09IoPBIWyLie4zcSfINsvXuBsqRuDxwUTKbr2PEiVm4vFsT0ME


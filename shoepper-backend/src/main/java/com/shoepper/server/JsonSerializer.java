package com.shoepper.server;

import java.lang.reflect.Method;
import java.util.Collection;
import java.util.Map;

/**
 * Minimal JSON serializer using reflection.
 * Handles: primitives, String, Boolean, null, List, Map, and any POJO with getters.
 * No external dependencies.
 */
public class JsonSerializer {

    public static String toJson(Object obj) {
        if (obj == null)                        return "null";
        if (obj instanceof String)              return "\"" + escape((String) obj) + "\"";
        if (obj instanceof Boolean)             return obj.toString();
        if (obj instanceof Number)              return obj.toString();
        if (obj instanceof Collection<?>)       return collectionToJson((Collection<?>) obj);
        if (obj instanceof Map<?, ?>)           return mapToJson((Map<?, ?>) obj);
        return pojoToJson(obj);
    }

    private static String collectionToJson(Collection<?> col) {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (Object item : col) {
            if (!first) sb.append(",");
            sb.append(toJson(item));
            first = false;
        }
        return sb.append("]").toString();
    }

    private static String mapToJson(Map<?, ?> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            if (!first) sb.append(",");
            sb.append("\"").append(escape(entry.getKey().toString())).append("\":");
            sb.append(toJson(entry.getValue()));
            first = false;
        }
        return sb.append("}").toString();
    }

    private static String pojoToJson(Object obj) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Method m : obj.getClass().getMethods()) {
            String name = m.getName();
            if (m.getParameterCount() != 0) continue;
            if (m.getDeclaringClass() == Object.class) continue;

            String field = null;
            if (name.startsWith("get") && name.length() > 3) {
                field = Character.toLowerCase(name.charAt(3)) + name.substring(4);
            } else if (name.startsWith("is") && name.length() > 2) {
                field = Character.toLowerCase(name.charAt(2)) + name.substring(3);
            }
            if (field == null) continue;

            try {
                Object value = m.invoke(obj);
                if (!first) sb.append(",");
                sb.append("\"").append(field).append("\":").append(toJson(value));
                first = false;
            } catch (Exception ignored) {}
        }
        return sb.append("}").toString();
    }

    /** Parses a JSON string into a Map<String, String> (single level, values as strings) */
    public static java.util.Map<String, String> parseFlat(String json) {
        java.util.Map<String, String> map = new java.util.LinkedHashMap<>();
        if (json == null) return map;
        json = json.trim();
        if (json.startsWith("{")) json = json.substring(1);
        if (json.endsWith("}"))   json = json.substring(0, json.length() - 1);

        // Tokenise key:value pairs
        int i = 0;
        while (i < json.length()) {
            // skip whitespace and commas
            while (i < json.length() && (json.charAt(i) == ',' || Character.isWhitespace(json.charAt(i)))) i++;
            if (i >= json.length()) break;
            if (json.charAt(i) != '"') break;

            // read key
            int keyStart = ++i;
            while (i < json.length() && json.charAt(i) != '"') i++;
            String key = json.substring(keyStart, i++);

            // skip : and whitespace
            while (i < json.length() && (json.charAt(i) == ':' || Character.isWhitespace(json.charAt(i)))) i++;

            // read value
            String value;
            if (i < json.length() && json.charAt(i) == '"') {
                int valStart = ++i;
                while (i < json.length() && json.charAt(i) != '"') i++;
                value = json.substring(valStart, i++);
            } else {
                int valStart = i;
                while (i < json.length() && json.charAt(i) != ',' && json.charAt(i) != '}') i++;
                value = json.substring(valStart, i).trim();
            }
            map.put(key, value);
        }
        return map;
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}

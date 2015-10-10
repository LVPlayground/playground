// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Define the data types which can be stored in a JSON files in an enum. This allows us to pass
 * around the enum rather than numeric values, which can easily be misinterpreted.
 */
enum JSONType
{
    JSONNull,
    JSONObject,
    JSONArray,
    JSONString,
    JSONInteger,
    JSONFloat,
    JSONBoolean
};

/**
 * Import the native functions required for fully supporing the JSON library. This relies on the
 * JSONReader plugin to be installed and made available.
 */
native JSON_parse(filename[]);
native JSON_next(Node: node);
native JSON_find(Node: node, name[]);
native JSON_firstChild(Node: node);
native JSON_getName(Node: node, buffer[], bufferSize);
native JSON_getType(Node: node);
native JSON_readString(Node: node, buffer[], bufferSize);
native JSON_readInteger(Node: node, &value);
native JSON_readFloat(Node: node, &Float: value);
native JSON_readBoolean(Node: node, &bool: value);
native JSON_close();

/**
 * Reading JSON files may be done through this class. Generally speaking, JSON is a much more
 * formatted file format that has the main benefit of being readable, while also being portable. By
 * utilizing JSON for settings, we can separate that from Las Venturas Playground's code.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class JSON
{
    /**
     * To verify whether a JSON file could be parsed, compare the returned Node to the InvalidNode
     * constant as defined here. If the file is unavailable, they will be equal.
     */
    public const InvalidNode = (Node: (0));

    /**
     * Open a file and parse it as JSON. The function will return a Node that may be used for basic
     * traversing using other functions in this class. Previously opened JSON files will be closed
     * when this method gets invoked.
     *
     * @param filename Filename which should be opened and parsed as a JSON file.
     * @return Node Base node of the parsed tree.
     */
    public inline Node: parse(filename[]) {
        return (Node: (JSON_parse(filename)));
    }

    /**
     * Get a handle to the next sibling from the given node.
     *
     * @param node The node to get the sibling of.
     * @return Node The next sibling of the passed on node.
     */
    public inline Node: next(Node: node) {
        return (Node: (JSON_next(node)));
    }

    /**
     * Get a handle to a child node with a specific name.
     *
     * @param node The node which should have a child of the given name.
     * @param name The name the node should be having.
     * @return Node The child-node, when it could be located.
     */
    public inline Node: find(Node: node, name[]) {
        return (Node: (JSON_find(node, name)));
    }

    /**
     * Get a handle to the first child element of the given node.
     *
     * @param node The node to get the first child from.
     * @return Node The first child of the given node.
     */
    public inline Node: firstChild(Node: node) {
        return (Node: (JSON_firstChild(node)));
    }

    /**
     * Retrieve the name of given node.
     *
     * @param node The node to retrieve the name from.
     * @param buffer The buffer to store the node's name in.
     * @param bufferSize Maximum size to which we can fill the buffer.
     */
    public inline getName(Node: node, buffer[], bufferSize) {
        JSON_getName(node, buffer, bufferSize);
    }

    /**
     * Determine the data type of the given node.
     *
     * @param node The node to retrieve the type from.
     * @return JSONType The type the node has.
     */
    public inline JSONType: getType(Node: node) {
        return (JSONType: (JSON_getType(node)));
    }

    /**
     * Read the node's value as a string into a buffer.
     *
     * @param node The node which' value should be read.
     * @param buffer The buffer to store the node's value in.
     * @param size Maximum size to which we can fill the buffer.
     */
    public inline readString(Node: node, buffer[], size) {
        JSON_readString(node, buffer, size);
    }

    /**
     * Read the node's value as an integer in the value variable.
     *
     * @param node The node which' value should be read.
     * @param value Variable to store the read integer value in.
     */
    public inline readInteger(Node: node, &value) {
        JSON_readInteger(node, value);
    }

    /**
     * Read the node's value as a float in the value variable.
     *
     * @param node The node which' value should be read.
     * @param value Variable to store the read float value in.
     */
    public inline readFloat(Node: node, &Float: value) {
        JSON_readFloat(node, value);
    }

    /**
     * Read the node's value as a boolean in the value variable.
     *
     * @param node The node which' value should be read.
     * @param value Variable to store the read boolean value in.
     */
    public inline readBoolean(Node: node, &bool: value) {
        JSON_readBoolean(node, value);
    }

    /**
     * Force a closing of the current JSON tree. This will free up the taken memory and will
     * immediately invalidate any created node.
     */
    public inline close() {
        JSON_close();
    }
}

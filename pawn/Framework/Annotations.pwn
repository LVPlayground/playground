// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Handling commands through the annotation system is a highly convenient way
 * of adding them, as it takes away a lot of manual work. Furthermore, this is
 * a lot faster as well. Define the public-facing function here.
 *
 * @param player_id Id of the player to handle commands for.
 * @param cmdtext Command text which was sent by the player.
 * @return integer One if we forwarded the command, 0 otherwise.
 */
#define Annotation::ProcessCommand( \
    __annotation_switch_Command(

/**
 * Invocation lists are a convenient way of grouping methods together which
 * should be called at a certain point in the code. This allows files to act
 * completely independant whereas they normally would require modifications
 * in various other parts of the code.
 *
 * Note that the current implementation has a small run-time cost. This is
 * expected to be fixed in future PreCompiler releases.
 *
 * @param name Name of the invocation list to process.
 */
#define Annotation::ExpandList<%0> \
    __annotation_list_%0

/**
 * Invocation switches are a variant of invocation lists with the exception
 * that only the method matching the condition will be invoked. This is the
 * second key annotation which aids in modularization.
 *
 * Note that the current implementation has a small run-time cost. This is
 * expected to be fixed in future PreCompiler releases.
 *
 * @param name Name of the invocation switch to process.
 * @return unknown Return value of the method which was executed, or -1.
 */
#define Annotation::ExpandSwitch<%0>( \
    __annotation_switch_%0(_:

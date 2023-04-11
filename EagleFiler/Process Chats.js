/*
 * Process Chats
 *
 * If any selected EagleFiler records are iChat/Messages transcripts,
 * extracts their starting times and participants' names (excluding
 * mine!) and sets their EagleFiler fields as follows:
 *
 *      title:      [YYYY]-[MM]-[DD] [hh]:[mm]:[ss] UTC
 *      from name:  [Participants]
 *      basename:   [YYYY][MM][DD]T[hh][mm][ss]Z [Participants]
 *
 * (Note that transcripts often contain inaccurate timestamps, due to
 * bugs I don't understand.  Start times are best understood as
 * approximations.)
 *
 * Selected records that are not transcripts are not modified.
 *
 * Last updated 2023-04-11.
 *
 * Copyright 2018, 2023 Lawrence Andrew Velázquez
 * SPDX-License-Identifier: MIT
 */

'use strict';

/*
 * Given a Date, returns an object containing string properties for its
 * year, month (01-12), day, hour (00-23), minute, and second.  All
 * properties other than the year are zero-padded to length 2.
 */
function getFormattedDateComponentsInUTC(date) {
    return {
        YYYY: date.getUTCFullYear().toString(),
        // getUTCMonth() is zero-indexed (January = 0, etc.).
        MM: (date.getUTCMonth() + 1).toString().padStart(2, '0'),
        DD: date.getUTCDate().toString().padStart(2, '0'),
        hh: date.getUTCHours().toString().padStart(2, '0'),
        mm: date.getUTCMinutes().toString().padStart(2, '0'),
        ss: date.getUTCSeconds().toString().padStart(2, '0'),
    };
}

/*
 * Given a Path to an iChat/Messages transcript, returns an object
 * containing the chat's starting time and participants' names.  (Note
 * that transcripts often contain inaccurate timestamps, due to bugs
 * I don't understand.  Start times are best understood as
 * approximations.)
 */
function metadataFromChat(path) {
    const unarchiver = openNSKeyedUnarchiver(path.toString());
    const metadata = unarchiver.decodeObjectForKey('metadata');
    if (metadata.isNil()) {
        throw new Error(`Could not extract metadata from “${path}”.`);
    }
    // Probably unnecessary in this context, but there's something to be
    // said for doing things properly.
    unarchiver.finishDecoding;
    return {
        participants: ObjC.deepUnwrap(metadata.objectForKey('Participants')),
        startTime: ObjC.unwrap(metadata.objectForKey('StartTime')),
    };
}

/*
 * Given a string representing the path to a Cocoa keyed archive, returns
 * an NSKeyedUnarchiver on the archive's data.
 */
function openNSKeyedUnarchiver(path) {
    const error = $();
    const data =
            $.NSData.alloc.initWithContentsOfFileOptionsError(path, 0, error);
    if (data.isNil()) {
        throw new Error(ObjC.unwrap(error.localizedDescription));
    }
    const unarchiver =
            $.NSKeyedUnarchiver.alloc.initForReadingFromDataError(data, error);
    if (unarchiver.isNil()) {
        throw new Error(ObjC.unwrap(error.localizedDescription));
    }

    // Can't seem to decode anything without turning this off.
    unarchiver.requiresSecureCoding = false;
    // Exceptions contain useful information.
    unarchiver.decodingFailurePolicy = $.NSDecodingFailurePolicyRaiseException;

    return unarchiver;
}

function run() {
    const EagleFiler = Application('com.c-command.EagleFiler');
    const records = EagleFiler.browserWindows[0].selectedRecords();
    Progress.totalUnitCount = records.length;

    for (const [idx, record] of records.entries()) {
        Progress.completedUnitCount = idx;

        const recordFile = record.file();
        let metadata;
        try {
            if (record.kind() !== 'Chat') {
                throw new Error('Not a chat, according to EagleFiler');
            }
            metadata = metadataFromChat(recordFile);
        } catch (error) {
            $.NSLog('%@: Skipping “%@” (%@)', $('Process Chats'),
                    $(recordFile.toString()), $(error.toString()));
            continue;
        }

        const {YYYY, MM, DD, hh, mm, ss} =
                getFormattedDateComponentsInUTC(metadata.startTime);
        const participants = metadata.participants
                .filter(name => !/^Lawrence (?:.+ )?Vel[aá]zquez$/u.test(name))
                .sort((a, b) => a.localeCompare(b))
                .join(', ');

        record.title = `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss} UTC`;
        record.fromName = participants;
        record.basename = `${YYYY}${MM}${DD}T${hh}${mm}${ss}Z ${participants}`;
    }
    Progress.completedUnitCount++;
}

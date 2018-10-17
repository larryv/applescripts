/*
 * Rename Chats to "[YYYYmmdd]T[HHMM] [Person]"
 *
 * If any selected EagleFiler records are iChat/Messages transcripts
 * with basenames in the default forms "[Person] on [YYYY]-[mm]-[dd] at
 * [HH].[MM]" or "[Person] on [YYYY]-[mm]-[dd] at [HH].[MM] #[num]", set
 * their fields as follows:
 *
 *      title:      [YYYY]-[mm]-[dd] [HH]:[MM]
 *                  or
 *                  [YYYY]-[mm]-[dd] [HH]:[MM] (#[num])
 *
 *      from name:  [Person]
 *
 *      basename:   [YYYY][mm][dd]T[HH][MM] [Person]
 *                  or
 *                  [YYYY][mm][dd]T[HH][MM] [Person] (#[num])
 *
 * Selected records that are not transcripts or that do not have default
 * basenames are not modified.
 *
 * Last updated 2018-10-17.
 */

'use strict';

// Ideally this would be const, but global const/let declarations
// interact poorly with OSA persistence.
var regex = /^(.+?) on (\d{4})-(\d{2})-(\d{2}) at (\d{2})\.(\d{2})(?: (#\d+))?$/;

Application('com.c-command.EagleFiler').browserWindows[0].selectedRecords()
    .filter(record => record.kind() === 'Chat')
    .map(record => ({record, metadata: regex.exec(record.basename())}))
    .filter(({metadata}) => metadata)
    .forEach(({record, metadata: [, person, YYYY, mm, dd, HH, MM, num]}) => {
        const suffix = num ? ` (${num})` : '';
        record.title = `${YYYY}-${mm}-${dd} ${HH}:${MM}${suffix}`;
        record.fromName = person;
        record.basename = `${YYYY}${mm}${dd}T${HH}${MM} ${person}${suffix}`;
    });
